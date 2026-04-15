import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
});

// Désactiver le body parser Next.js — Stripe a besoin du raw body
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  // Si pas de webhook secret configuré, on accepte tout (dev)
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      // Dev mode — parse directement
      event = JSON.parse(body) as Stripe.Event;
      console.warn('[stripe-webhook] No webhook secret — accepting unverified event');
    }
  } catch (err: any) {
    console.error('[stripe-webhook] Signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // ── checkout.session.completed ──
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const quoteId = session.metadata?.quote_id;

    if (!quoteId) {
      console.error('[stripe-webhook] No quote_id in metadata');
      return NextResponse.json({ error: 'No quote_id' }, { status: 400 });
    }

    console.log(`[stripe-webhook] Payment completed for quote ${quoteId}`);

    // Charger le devis
    const { data: quote } = await supabaseAdmin
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (!quote) {
      console.error(`[stripe-webhook] Quote ${quoteId} not found`);
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    // Mettre à jour le devis
    await supabaseAdmin
      .from('quotes')
      .update({ statut: 'paye' })
      .eq('id', quoteId);

    // Créer la commande
    await supabaseAdmin.from('orders').insert({
      quote_id: quoteId,
      client_id: quote.client_id || null,
      circuit: 'B', // Par défaut circuit B (TopTex + Siri) — à adapter
      statut: 'en_attente',
      lignes: quote.lignes,
      montant_ht: quote.total_ht,
      montant_ttc: Math.ceil(Number(quote.total_ht) * 1.2 * 100) / 100,
      paye: true,
      paye_at: new Date().toISOString(),
      stripe_payment_intent: session.payment_intent as string,
    });

    // Notifier l'admin
    await notifyAdminPayment(quoteId, quote, session).catch(console.error);
  }

  return NextResponse.json({ received: true });
}

// ─── Email admin paiement reçu ──────────────────────────────────────────────

async function notifyAdminPayment(quoteId: string, quote: any, session: Stripe.Checkout.Session) {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL || 'contact@toque2me.com';
  if (!apiKey) return;

  const { Resend } = await import('resend');
  const resend = new Resend(apiKey);

  const totalHt = Number(quote.total_ht);
  const totalTtc = Math.ceil(totalHt * 1.2 * 100) / 100;
  const lignes = quote.lignes || [];

  await resend.emails.send({
    from: 'Toque2Me <devis@toque2me.com>',
    to: adminEmail,
    subject: `Paiement reçu — Devis #${quoteId.slice(0, 8)} — ${totalTtc.toFixed(2)} € TTC`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;">
        <tr><td style="background:#16a34a;padding:20px 24px;">
          <h1 style="margin:0;color:#fff;font-size:18px;">Paiement reçu</h1>
        </td></tr>
        <tr><td style="padding:24px;">
          <p style="margin:0 0 12px;font-size:14px;color:#333;">
            Le devis <strong>#${quoteId.slice(0, 8)}</strong> a été payé via Stripe.
          </p>
          <p style="margin:0 0 12px;font-size:14px;color:#333;">
            <strong>Montant :</strong> ${totalTtc.toFixed(2)} € TTC<br>
            <strong>Produits :</strong> ${lignes.map((l: any) => `${l.nom} x${l.qty}`).join(', ')}
          </p>
          <p style="margin:16px 0 0;font-size:13px;">
            <a href="https://toque2me.com/admin?key=${process.env.ADMIN_SECRET}" style="color:#16a34a;font-weight:bold;">
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
