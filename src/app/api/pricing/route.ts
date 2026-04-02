import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { getMargin } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

// Rate limit : 60 requêtes/heure/IP
const pricingRates = new Map<string, { count: number; reset: number }>();

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  const rate = pricingRates.get(ip);
  if (!rate || now > rate.reset) {
    pricingRates.set(ip, { count: 1, reset: now + 3600000 });
  } else if (rate.count >= 60) {
    return NextResponse.json({ error: 'Trop de requêtes.' }, { status: 429 });
  } else {
    rate.count++;
  }

  const ref = req.nextUrl.searchParams.get('ref');
  const qty = parseInt(req.nextUrl.searchParams.get('qty') || '1');

  if (!ref) return NextResponse.json({ error: 'ref required' }, { status: 400 });

  // 1. Trouver le produit
  const { data: product } = await supabase
    .from('products')
    .select('id, fournisseur, categorie, nom')
    .eq('ref_fournisseur', ref)
    .single();

  if (!product) return NextResponse.json({ error: 'product not found' }, { status: 404 });

  // 2. Récupérer les paliers de prix
  const { data: prices } = await supabase
    .from('prices')
    .select('qte_min, qte_max, prix_ht')
    .eq('product_id', product.id)
    .order('qte_min', { ascending: true });

  if (!prices || prices.length === 0) {
    return NextResponse.json({ error: 'no pricing' }, { status: 404 });
  }

  // 3. Récupérer la marge
  const margin = await getMargin(product.fournisseur, product.categorie);

  // 4. Calculer les paliers de vente
  const tiers = prices.map((p) => ({
    qte_min: p.qte_min,
    qte_max: p.qte_max,
    prix_vente_ht: Math.ceil(Number(p.prix_ht) * margin.coefficient * 100) / 100,
  }));

  // 5. Trouver le prix pour la quantité demandée
  let prixUnitaire = tiers[0].prix_vente_ht;
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (qty >= tiers[i].qte_min) {
      prixUnitaire = tiers[i].prix_vente_ht;
      break;
    }
  }

  const totalHt = Math.ceil(prixUnitaire * qty * 100) / 100;
  const fraisPort = totalHt >= margin.franco_port_ht ? 0 : margin.frais_port_ht;
  const totalAvecPort = totalHt + fraisPort;
  const restantFranco = totalHt >= margin.franco_port_ht ? 0 : margin.franco_port_ht - totalHt;

  return NextResponse.json({
    ref,
    nom: product.nom,
    qty,
    prix_unitaire_ht: prixUnitaire,
    total_ht: totalHt,
    frais_port_ht: fraisPort,
    franco_port_ht: margin.franco_port_ht,
    restant_franco: restantFranco,
    total_avec_port_ht: totalAvecPort,
    tva: Math.ceil(totalAvecPort * 0.2 * 100) / 100,
    total_ttc: Math.ceil(totalAvecPort * 1.2 * 100) / 100,
    tiers,
  });
}
