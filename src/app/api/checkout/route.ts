import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
});

export async function POST(req: NextRequest) {
  const { quote_id, share_token } = await req.json();

  if (!quote_id && !share_token) {
    return NextResponse.json({ error: 'quote_id ou share_token requis' }, { status: 400 });
  }

  // Charger le devis
  let query = supabaseAdmin.from('quotes').select('*');
  if (share_token) query = query.eq('share_token', share_token);
  else query = query.eq('id', quote_id);

  const { data: quote, error } = await query.single();
  if (error || !quote) {
    return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 });
  }

  // Vérifier qu'il n'est pas déjà payé
  if (quote.statut === 'paye') {
    return NextResponse.json({ error: 'Ce devis est déjà payé' }, { status: 400 });
  }

  const lignes = quote.lignes || [];
  const totalHt = Number(quote.total_ht);
  const totalTtc = Math.ceil(totalHt * 1.2 * 100); // en centimes pour Stripe

  // Construire les line_items Stripe
  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = lignes.map((l: any) => ({
    price_data: {
      currency: 'eur',
      product_data: {
        name: l.nom,
        description: `Réf. ${l.ref}${l.couleur_nom ? ` — ${l.couleur_nom}` : ''} — ${l.qty} pce${l.qty > 1 ? 's' : ''}`,
        ...(l.image_url ? { images: [l.image_url] } : {}),
      },
      unit_amount: Math.round(l.prix_unitaire_ht * 1.2 * 100), // TTC en centimes
    },
    quantity: l.qty,
  }));

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://toque2me.com';

  // Créer la Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items,
    metadata: {
      quote_id: quote.id,
      share_token: quote.share_token,
    },
    success_url: `${baseUrl}/paiement/succes?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/paiement/annule?token=${quote.share_token}`,
    locale: 'fr',
  });

  // Sauvegarder l'ID de session sur le devis
  await supabaseAdmin
    .from('quotes')
    .update({
      stripe_checkout_url: session.url,
      statut: 'envoye',
    })
    .eq('id', quote.id);

  return NextResponse.json({ url: session.url });
}
