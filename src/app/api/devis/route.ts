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
  couleur?: string; // nom de la couleur sélectionnée
}

interface LigneDevis {
  ref: string;
  nom: string;
  categorie: string;
  image_url: string;
  couleur_nom?: string;
  couleur_hexa?: string;
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
    .select('id, nom, ref_fournisseur, categorie, fournisseur, image_url, couleurs')
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

    // Trouver l'image couleur si une couleur est spécifiée
    let imageUrl = product.image_url;
    let couleurNom: string | undefined;
    let couleurHexa: string | undefined;
    if (input.couleur && product.couleurs) {
      const couleurs = product.couleurs as { nom: string; hexa: string; image?: string }[];
      const match = couleurs.find(c => c.nom.toLowerCase() === input.couleur!.toLowerCase());
      if (match) {
        couleurNom = match.nom;
        couleurHexa = match.hexa;
        if (match.image) imageUrl = match.image;
      }
    }

    lignes.push({
      ref: product.ref_fournisseur,
      nom: product.nom,
      categorie: product.categorie,
      image_url: imageUrl,
      couleur_nom: couleurNom,
      couleur_hexa: couleurHexa,
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

  // ── Notifier l'admin par email (fire & forget) ──
  notifyAdmin(quote.id, lignes, totalHt, totalAvecPort).catch(() => {});

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

// ─── Email notification admin ───────────────────────────────────────────────

async function notifyAdmin(quoteId: string, lignes: LigneDevis[], totalHt: number, totalAvecPort: number) {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL || 'contact@toque2me.com';
  if (!apiKey) return;

  const { Resend } = await import('resend');
  const resend = new Resend(apiKey);

  const lignesHtml = lignes.map(l =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${l.nom}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">${l.qty}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;">${l.prix_unitaire_ht.toFixed(2)} €</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;">${l.total_ligne_ht.toFixed(2)} €</td>
    </tr>`
  ).join('');

  await resend.emails.send({
    from: 'Toque2Me <devis@toque2me.com>',
    to: adminEmail,
    subject: `Nouveau devis #${quoteId.slice(0, 8)} — ${totalAvecPort.toFixed(2)} € HT`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;">
        <tr><td style="background:#171717;padding:20px 24px;">
          <h1 style="margin:0;color:#fff;font-size:18px;">Nouveau devis</h1>
        </td></tr>
        <tr><td style="padding:24px;">
          <p style="margin:0 0 16px;font-size:14px;color:#333;">
            Un nouveau devis vient d'être généré sur Toque2Me.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#333;">
            <thead>
              <tr style="background:#f9fafb;">
                <th style="padding:8px 12px;text-align:left;">Produit</th>
                <th style="padding:8px 12px;text-align:center;">Qté</th>
                <th style="padding:8px 12px;text-align:right;">PU HT</th>
                <th style="padding:8px 12px;text-align:right;">Total</th>
              </tr>
            </thead>
            <tbody>${lignesHtml}</tbody>
            <tfoot>
              <tr style="font-weight:bold;">
                <td colspan="3" style="padding:10px 12px;text-align:right;">Total HT</td>
                <td style="padding:10px 12px;text-align:right;">${totalHt.toFixed(2)} €</td>
              </tr>
              <tr style="font-weight:bold;font-size:15px;">
                <td colspan="3" style="padding:10px 12px;text-align:right;">Total TTC</td>
                <td style="padding:10px 12px;text-align:right;">${(totalAvecPort * 1.2).toFixed(2)} €</td>
              </tr>
            </tfoot>
          </table>
          <p style="margin:20px 0 0;font-size:13px;">
            <a href="https://toque2me.com/admin?key=${process.env.ADMIN_SECRET}" style="color:#171717;font-weight:bold;">
              Voir dans le back-office →
            </a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}
