import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getMargin } from '@/lib/pricing';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { ref, qty, client_id } = await req.json();

  if (!ref || !qty) {
    return NextResponse.json({ error: 'ref and qty required' }, { status: 400 });
  }

  // 1. Produit
  const { data: product } = await supabase
    .from('products')
    .select('id, nom, ref_fournisseur, categorie, fournisseur, image_url')
    .eq('ref_fournisseur', ref)
    .single();

  if (!product) return NextResponse.json({ error: 'product not found' }, { status: 404 });

  // 2. Prix
  const { data: prices } = await supabase
    .from('prices')
    .select('qte_min, qte_max, prix_ht')
    .eq('product_id', product.id)
    .order('qte_min');

  if (!prices || prices.length === 0) {
    return NextResponse.json({ error: 'no pricing' }, { status: 404 });
  }

  const margin = await getMargin(product.fournisseur, product.categorie);

  // Trouver le palier
  let prixAchat = Number(prices[0].prix_ht);
  for (let i = prices.length - 1; i >= 0; i--) {
    if (qty >= prices[i].qte_min) {
      prixAchat = Number(prices[i].prix_ht);
      break;
    }
  }

  const prixVenteUnitaire = Math.ceil(prixAchat * margin.coefficient * 100) / 100;
  const totalHt = Math.ceil(prixVenteUnitaire * qty * 100) / 100;
  const fraisPort = totalHt >= margin.franco_port_ht ? 0 : margin.frais_port_ht;
  const totalAvecPort = totalHt + fraisPort;

  // 3. Créer le devis
  const shareToken = crypto.randomBytes(16).toString('hex');
  const lignes = [
    {
      ref: product.ref_fournisseur,
      nom: product.nom,
      categorie: product.categorie,
      image_url: product.image_url,
      qty,
      prix_unitaire_ht: prixVenteUnitaire,
      total_ligne_ht: totalHt,
    },
  ];

  const { data: quote, error } = await supabase
    .from('quotes')
    .insert({
      client_id: client_id || null,
      statut: 'brouillon',
      lignes,
      total_ht: totalAvecPort,
      share_token: shareToken,
    })
    .select('id, share_token, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    id: quote.id,
    share_token: quote.share_token,
    share_url: `/devis/${quote.share_token}`,
    created_at: quote.created_at,
    lignes,
    total_ht: totalHt,
    frais_port_ht: fraisPort,
    total_avec_port_ht: totalAvecPort,
    tva: Math.ceil(totalAvecPort * 0.2 * 100) / 100,
    total_ttc: Math.ceil(totalAvecPort * 1.2 * 100) / 100,
  });
}
