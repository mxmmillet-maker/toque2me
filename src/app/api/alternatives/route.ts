import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { getMargin } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

// Rate limit : 30 requêtes/heure/IP
const alternativesRates = new Map<string, { count: number; reset: number }>();

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  const rate = alternativesRates.get(ip);
  if (!rate || now > rate.reset) {
    alternativesRates.set(ip, { count: 1, reset: now + 3600000 });
  } else if (rate.count >= 30) {
    return NextResponse.json({ error: 'Trop de requêtes.' }, { status: 429 });
  } else {
    rate.count++;
  }

  const ref = req.nextUrl.searchParams.get('ref');
  const categorie = req.nextUrl.searchParams.get('categorie');

  if (!ref || !categorie) {
    return NextResponse.json({ error: 'ref and categorie required' }, { status: 400 });
  }

  // 1. Charger les produits de la même catégorie (hors ref courante)
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, ref_fournisseur, nom, image_url, grammage, score_premium, score_durabilite, genre, categorie')
    .eq('categorie', categorie)
    .neq('ref_fournisseur', ref)
    .limit(100);

  if (productsError || !products || products.length === 0) {
    return NextResponse.json({ alternatives: [] });
  }

  // 2. Charger les prix par batch (même pattern que agent/chat/route.ts)
  const productIds = products.map((p) => p.id);
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

  // 3. Filtrer : uniquement les produits avec un prix, et enrichir avec tags
  const alternatives = products
    .filter((p) => prixMap.has(p.id))
    .map((p) => {
      const genre = detectGenre(p.nom || '');
      return {
        ref: p.ref_fournisseur,
        nom: p.nom,
        image_url: p.image_url || '',
        grammage: p.grammage || null,
        prix_vente_ht: prixMap.get(p.id)!,
        score_premium: p.score_premium || 50,
        score_durabilite: p.score_durabilite || 50,
        tags: [],
        genre,
      };
    })
    .sort((a, b) => b.score_premium - a.score_premium)
    .slice(0, 20);

  return NextResponse.json({ alternatives });
}

function detectGenre(nom: string): string {
  const lower = nom.toLowerCase();
  if (lower.includes('enfant') || lower.includes('junior') || lower.includes('kids')) return 'Enfant';
  if (lower.includes(' femme') || lower.includes(' lady') || lower.includes(' ladies')) return 'Femme';
  if (lower.includes(' homme') || lower.includes(' men')) return 'Homme';
  return 'Unisexe';
}
