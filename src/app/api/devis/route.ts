import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { getMargin } from '@/lib/pricing';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Rate limit : 10 devis/heure/IP
const devisRates = new Map<string, { count: number; reset: number }>();

interface LigneInput {
  ref: string;
  qty: number;
}

interface LigneDevis {
  ref: string;
  nom: string;
  categorie: string;
  image_url: string;
  qty: number;
  prix_unitaire_ht: number;
  total_ligne_ht: number;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  const rate = devisRates.get(ip);
  if (!rate || now > rate.reset) {
    devisRates.set(ip, { count: 1, reset: now + 3600000 });
  } else if (rate.count >= 10) {
    return NextResponse.json({ error: 'Trop de devis créés. Réessayez plus tard.' }, { status: 429 });
  } else {
    rate.count++;
  }

  const body = await req.json();

  // Normaliser l'input : single { ref, qty } ou multi { lignes: [{ref, qty}] }
  let inputLignes: LigneInput[];
  if (body.lignes && Array.isArray(body.lignes)) {
    inputLignes = body.lignes;
  } else if (body.ref && body.qty) {
    inputLignes = [{ ref: body.ref, qty: body.qty }];
  } else {
    return NextResponse.json({ error: 'ref/qty ou lignes requis' }, { status: 400 });
  }

  // Validation
  if (inputLignes.length === 0 || inputLignes.length > 20) {
    return NextResponse.json({ error: 'Entre 1 et 20 lignes max' }, { status: 400 });
  }
  for (const l of inputLignes) {
    if (typeof l.ref !== 'string' || l.ref.length > 30) {
      return NextResponse.json({ error: `ref invalide: ${l.ref}` }, { status: 400 });
    }
    const q = Number(l.qty);
    if (!Number.isInteger(q) || q < 1 || q > 10000) {
      return NextResponse.json({ error: `qty invalide pour ${l.ref}` }, { status: 400 });
    }
  }

  // Charger tous les produits en une requête
  const refs = inputLignes.map(l => l.ref);
  const { data: products } = await supabase
    .from('products')
    .select('id, nom, ref_fournisseur, categorie, fournisseur, image_url')
    .in('ref_fournisseur', refs);

  if (!products || products.length === 0) {
    return NextResponse.json({ error: 'Aucun produit trouvé' }, { status: 404 });
  }

  const productMap = new Map(products.map(p => [p.ref_fournisseur, p]));

  // Charger tous les prix en une requête
  const productIds = products.map(p => p.id);
  const { data: allPrices } = await supabase
    .from('prices')
    .select('product_id, qte_min, prix_ht')
    .in('product_id', productIds)
    .order('qte_min');

  // Grouper les prix par product_id
  const pricesByProduct = new Map<string, { qte_min: number; prix_ht: number }[]>();
  for (const p of (allPrices || [])) {
    if (!pricesByProduct.has(p.product_id)) pricesByProduct.set(p.product_id, []);
    pricesByProduct.get(p.product_id)!.push(p);
  }

  // Construire les lignes du devis
  const lignes: LigneDevis[] = [];
  let totalHt = 0;

  for (const input of inputLignes) {
    const product = productMap.get(input.ref);
    if (!product) continue;

    const prices = pricesByProduct.get(product.id) || [];
    if (prices.length === 0) continue;

    const margin = await getMargin(product.fournisseur, product.categorie);

    // Trouver le palier de prix
    let prixAchat = Number(prices[0].prix_ht);
    for (let i = prices.length - 1; i >= 0; i--) {
      if (input.qty >= prices[i].qte_min) {
        prixAchat = Number(prices[i].prix_ht);
        break;
      }
    }

    const prixVenteUnitaire = Math.ceil(prixAchat * margin.coefficient * 100) / 100;
    const totalLigne = Math.ceil(prixVenteUnitaire * input.qty * 100) / 100;

    lignes.push({
      ref: product.ref_fournisseur,
      nom: product.nom,
      categorie: product.categorie,
      image_url: product.image_url,
      qty: input.qty,
      prix_unitaire_ht: prixVenteUnitaire,
      total_ligne_ht: totalLigne,
    });

    totalHt += totalLigne;
  }

  if (lignes.length === 0) {
    return NextResponse.json({ error: 'Aucun produit avec prix disponible' }, { status: 404 });
  }

  totalHt = Math.ceil(totalHt * 100) / 100;

  // Frais de port (basés sur la première marge — à affiner si multi-fournisseur)
  const firstProduct = productMap.get(lignes[0].ref)!;
  const margin = await getMargin(firstProduct.fournisseur, firstProduct.categorie);
  const fraisPort = totalHt >= margin.franco_port_ht ? 0 : margin.frais_port_ht;
  const totalAvecPort = totalHt + fraisPort;

  // Créer le devis
  const shareToken = crypto.randomBytes(16).toString('hex');
  const { data: quote, error } = await supabase
    .from('quotes')
    .insert({
      client_id: body.client_id || null,
      statut: 'brouillon',
      lignes,
      total_ht: totalHt,
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
