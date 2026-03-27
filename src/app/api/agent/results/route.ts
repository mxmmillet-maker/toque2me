import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { scoreProducts, getTop } from '@/lib/agent/scoring';
import { getMargin } from '@/lib/pricing';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { context } = await req.json();

  // 1. Charger les produits actifs et non exclus
  let query = supabase.from('products').select('*')
    .eq('actif', true)
    .or('exclu.is.null,exclu.eq.false')
    .order('nom');

  if (context?.typologies && context.typologies.length > 0) {
    query = query.in('categorie', context.typologies);
  }

  const { data: allProducts } = await query.limit(500);
  if (!allProducts || allProducts.length === 0) {
    return Response.json({ products: [], message: 'Aucun produit trouvé pour ces critères.' });
  }

  // 2. Charger les prix
  const productIds = allProducts.map((p) => p.id);
  const { data: prices } = await supabase
    .from('prices')
    .select('product_id, qte_min, prix_ht')
    .in('product_id', productIds)
    .order('qte_min');

  const margin = await getMargin('cybernecard');

  const prixMap = new Map<string, number>();
  if (prices) {
    for (const p of prices) {
      if (!prixMap.has(p.product_id)) {
        prixMap.set(p.product_id, Math.ceil(Number(p.prix_ht) * margin.coefficient * 100) / 100);
      }
    }
  }

  // 3. Scorer et retourner le top 4 diversifié
  const scored = scoreProducts(allProducts, {
    typologies: context?.typologies,
    secteur: context?.secteur,
    budget_global: context?.budget_global,
    nb_personnes: context?.nb_personnes,
    usage: context?.usage,
    style: context?.style,
    priorites: context?.priorites,
  }, prixMap);

  const top = getTop(scored, 4);

  return Response.json({ products: top });
}
