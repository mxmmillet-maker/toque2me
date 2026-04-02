import { NextRequest } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { scoreProducts, getTop } from '@/lib/agent/scoring';
import { getMargin } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

// Rate limit : 30 requêtes/heure/IP
const resultsRates = new Map<string, { count: number; reset: number }>();

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  const rate = resultsRates.get(ip);
  if (!rate || now > rate.reset) {
    resultsRates.set(ip, { count: 1, reset: now + 3600000 });
  } else if (rate.count >= 30) {
    return Response.json({ error: 'Trop de requêtes.' }, { status: 429 });
  } else {
    rate.count++;
  }

  const { context } = await req.json();

  // 1. Charger les produits actifs et non exclus
  let query = supabase.from('products').select('*')
    .eq('actif', true)
    .or('exclu.is.null,exclu.eq.false')
    .order('nom');

  if (context?.typologies && context.typologies.length > 0) {
    query = query.in('categorie', context.typologies);
  }

  const { data: allProducts } = await query.limit(2000);
  if (!allProducts || allProducts.length === 0) {
    return Response.json({ products: [], message: 'Aucun produit trouvé pour ces critères.' });
  }

  // 2. Charger les prix (par batches pour éviter URL trop longues)
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

  const prixMap = new Map<string, number>();
  for (const p of allPrices) {
    if (!prixMap.has(p.product_id)) {
      prixMap.set(p.product_id, Math.ceil(Number(p.prix_ht) * margin.coefficient * 100) / 100);
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
    repartition_hf: context?.repartition_hf,
    couleurs: context?.couleurs,
    priorites: context?.priorites,
  }, prixMap);

  const top = getTop(scored, 4);

  return Response.json({ products: top });
}
