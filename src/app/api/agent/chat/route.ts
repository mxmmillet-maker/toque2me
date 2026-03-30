import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { scoreProducts, getTop } from '@/lib/agent/scoring';
import { buildSystemPrompt } from '@/lib/agent/prompt';
import { getMargin } from '@/lib/pricing';

export const maxDuration = 30; // Vercel Hobby max = 60s

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Rate limiting par session (en mémoire — reset au redeploy)
const sessionCounts = new Map<string, { count: number; reset: number }>();

function checkRateLimit(sessionId: string): boolean {
  const now = Date.now();
  const entry = sessionCounts.get(sessionId);
  if (!entry || now > entry.reset) {
    sessionCounts.set(sessionId, { count: 1, reset: now + 3600000 }); // 1h window
    return true;
  }
  if (entry.count >= 20) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const { messages, context } = await req.json();
  const sessionId = context?.sessionId || 'anon';

  // Rate limit : 20 messages par session
  if (!checkRateLimit(sessionId)) {
    return Response.json(
      { error: 'Limite de messages atteinte. Rafraîchissez la page pour une nouvelle session.' },
      { status: 429 }
    );
  }

  // 1. Charger les produits filtrés par typologies (actifs et non exclus uniquement)
  let query = supabase.from('products').select('*')
    .eq('actif', true)
    .or('exclu.is.null,exclu.eq.false')
    .order('nom');

  if (context?.typologies && context.typologies.length > 0) {
    query = query.in('categorie', context.typologies);
  }

  const { data: allProducts } = await query.limit(500);
  if (!allProducts || allProducts.length === 0) {
    return Response.json({ fallback: true, products: [], message: 'Aucun produit trouvé pour ces critères.' });
  }

  // 2. Charger les prix de vente
  const productIds = allProducts.map((p) => p.id);
  const { data: prices } = await supabase
    .from('prices')
    .select('product_id, qte_min, prix_ht')
    .in('product_id', productIds)
    .order('qte_min');

  const margin = await getMargin('cybernecard');

  // Map product_id → prix vente min (palier qte_min le plus bas)
  const prixMap = new Map<string, number>();
  if (prices) {
    for (const p of prices) {
      if (!prixMap.has(p.product_id)) {
        prixMap.set(p.product_id, Math.ceil(Number(p.prix_ht) * margin.coefficient * 100) / 100);
      }
    }
  }

  // 3. Scorer et garder TOP 15
  const scored = scoreProducts(allProducts, {
    typologies: context?.typologies,
    secteur: context?.secteur,
    budget_global: context?.budget_global,
    nb_personnes: context?.nb_personnes,
    usage: context?.usage,
    style: context?.style,
    priorites: context?.priorites,
  }, prixMap);

  const top15 = getTop(scored, 15);

  // 4. Fallback si pas de clé API ou timeout
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({
      fallback: true,
      products: getTop(scored, 4),
      message: 'Voici notre sélection basée sur vos critères.',
    });
  }

  // 5. Streaming Claude
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); // 25s (Vercel Hobby max = 60s)

    const systemPrompt = buildSystemPrompt({
      products: top15,
      secteur: context?.secteur,
      budget_global: context?.budget_global,
      nb_personnes: context?.nb_personnes,
      usage: context?.usage,
      typologies: context?.typologies,
      style: context?.style,
      type_etablissement: context?.type_etablissement,
    });

    const stream = client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    }, { signal: controller.signal });

    clearTimeout(timeout);

    // Convertir en ReadableStream pour le streaming HTTP
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(ctrl) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta') {
              const delta = event.delta as any;
              if (delta.type === 'text_delta') {
                ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ text: delta.text })}\n\n`));
              }
            }
          }
          ctrl.enqueue(encoder.encode('data: [DONE]\n\n'));
          ctrl.close();
        } catch (err) {
          // T-24 : fallback silencieux si streaming échoue
          const fallbackMsg = JSON.stringify({
            fallback: true,
            products: getTop(scored, 4).map((p) => ({
              nom: p.nom,
              ref: p.ref_fournisseur,
              prix: p.prix_vente_ht,
              categorie: p.categorie,
            })),
          });
          ctrl.enqueue(encoder.encode(`data: ${fallbackMsg}\n\n`));
          ctrl.enqueue(encoder.encode('data: [DONE]\n\n'));
          ctrl.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch {
    // T-24 : fallback complet si Claude indisponible
    return Response.json({
      fallback: true,
      products: getTop(scored, 4),
      message: 'Voici notre sélection basée sur vos critères.',
    });
  }
}
