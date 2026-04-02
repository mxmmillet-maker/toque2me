import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { getMargin } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const refs = req.nextUrl.searchParams.get('refs')?.split(',').filter(Boolean);
  if (!refs || refs.length === 0) {
    return NextResponse.json({ products: [] });
  }

  // Limiter le nombre de refs (évite scan massif du catalogue)
  if (refs.length > 20) {
    return NextResponse.json({ error: 'Max 20 produits par requête' }, { status: 400 });
  }

  const { data: products } = await supabase
    .from('products')
    .select('id, nom, ref_fournisseur, image_url, categorie, fournisseur')
    .in('ref_fournisseur', refs);

  if (!products) return NextResponse.json({ products: [] });

  const margin = await getMargin('cybernecard');

  // Récupérer les prix
  const ids = products.map((p) => p.id);
  const { data: prices } = await supabase
    .from('prices')
    .select('product_id, prix_ht')
    .in('product_id', ids)
    .order('qte_min');

  const prixMap = new Map<string, number>();
  if (prices) {
    for (const p of prices) {
      if (!prixMap.has(p.product_id)) {
        prixMap.set(p.product_id, Math.ceil(Number(p.prix_ht) * margin.coefficient * 100) / 100);
      }
    }
  }

  const result = products.map((p) => ({
    ...p,
    prix_vente_ht: prixMap.get(p.id) || null,
  }));

  return NextResponse.json({ products: result });
}
