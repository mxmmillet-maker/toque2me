import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { scoreProducts, getTop } from '@/lib/agent/scoring';
import { buildSystemPrompt } from '@/lib/agent/prompt';
import { getMargin } from '@/lib/pricing';

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Vercel Hobby max = 60s

// ─── SÉCURITÉ ───────────────────────────────────────────
const MAX_MESSAGES = 20;       // historique max envoyé à Claude
const MAX_MSG_LENGTH = 2000;   // caractères max par message
const RATE_WINDOW_MS = 3600000; // 1h
const RATE_MAX = 30;           // requêtes par IP par heure

// Rate limiting par IP (plus difficile à contourner que sessionId)
const ipCounts = new Map<string, { count: number; reset: number }>();

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipCounts.get(ip);
  if (!entry || now > entry.reset) {
    ipCounts.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_MAX) return false;
  entry.count++;
  return true;
}

// Nettoyage périodique mémoire (évite fuite sur long run)
setInterval(() => {
  const now = Date.now();
  ipCounts.forEach((val, key) => {
    if (now > val.reset) ipCounts.delete(key);
  });
}, 600000); // toutes les 10 min

// Validation et sanitisation des messages
function sanitizeMessages(raw: any[]): { role: 'user' | 'assistant'; content: string }[] {
  if (!Array.isArray(raw)) return [];
  const ALLOWED_ROLES = new Set(['user', 'assistant']);

  return raw
    .filter((m) => m && ALLOWED_ROLES.has(m.role) && typeof m.content === 'string' && m.content.trim())
    .slice(-MAX_MESSAGES) // garder seulement les N derniers
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content.slice(0, MAX_MSG_LENGTH),
    }));
}

export async function POST(req: NextRequest) {
  // Rate limit par IP
  const clientIp = getClientIp(req);
  if (!checkRateLimit(clientIp)) {
    return Response.json(
      { error: 'Trop de requêtes. Réessayez dans quelques minutes.' },
      { status: 429 }
    );
  }

  const body = await req.json();
  const context = body.context;

  // Valider et sanitiser les messages (bloque injection de role "system", tronque, limite l'historique)
  const messages = sanitizeMessages(body.messages);
  if (messages.length === 0) {
    return Response.json({ error: 'Message invalide.' }, { status: 400 });
  }

  // 1. Charger les produits filtrés par typologies (actifs et non exclus uniquement)
  let query = supabase.from('products').select('*')
    .eq('actif', true)
    .or('exclu.is.null,exclu.eq.false')
    .order('nom');

  if (context?.typologies && context.typologies.length > 0) {
    query = query.in('categorie', context.typologies);
  }

  const { data: allProducts } = await query.limit(2000);
  if (!allProducts || allProducts.length === 0) {
    return Response.json({ fallback: true, products: [], message: 'Aucun produit trouvé pour ces critères.' });
  }

  // 2. Charger les prix de vente (par batches pour éviter URL trop longues)
  const productIds = allProducts.map((p) => p.id);
  const allPrices: { product_id: string; qte_min: number; prix_ht: number }[] = [];
  for (let i = 0; i < productIds.length; i += 200) {
    const batch = productIds.slice(i, i + 200);
    const { data } = await supabase
      .from('prices')
      .select('product_id, qte_min, prix_ht')
      .in('product_id', batch)
      .order('qte_min');
    if (data) allPrices.push(...data);
  }

  const margin = await getMargin('cybernecard');

  // Map product_id → prix vente min (palier qte_min le plus bas)
  const prixMap = new Map<string, number>();
  for (const p of allPrices) {
    if (!prixMap.has(p.product_id)) {
      prixMap.set(p.product_id, Math.ceil(Number(p.prix_ht) * margin.coefficient * 100) / 100);
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
    repartition_hf: context?.repartition_hf,
    couleurs: context?.couleurs,
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
      metier: context?.metier,
    });

    const stream = client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
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
