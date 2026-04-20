'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── Marges ─────────────────────────────────────────────────────────────────

const ALLOWED_FIELDS = ['coefficient', 'franco_port_ht', 'frais_port_ht'];

export async function updateMargin(id: string, field: string, value: number) {
  if (!id || !ALLOWED_FIELDS.includes(field) || typeof value !== 'number' || isNaN(value)) {
    return { error: 'Paramètres invalides' };
  }
  if (field === 'coefficient' && (value < 1 || value > 5)) {
    return { error: 'Coefficient doit être entre 1 et 5' };
  }
  if ((field === 'franco_port_ht' || field === 'frais_port_ht') && (value < 0 || value > 500)) {
    return { error: 'Valeur port doit être entre 0 et 500' };
  }

  const { error } = await supabaseAdmin
    .from('margins')
    .update({ [field]: value })
    .eq('id', id);

  if (error) return { error: error.message };
  return { ok: true };
}

// ─── Devis ──────────────────────────────────────────────────────────────────

export async function updateQuoteStatut(quoteId: string, statut: string) {
  const VALID = ['brouillon', 'envoye', 'accepte', 'refuse', 'expire'];
  if (!VALID.includes(statut)) return { error: 'Statut invalide' };

  const { error } = await supabaseAdmin
    .from('quotes')
    .update({ statut })
    .eq('id', quoteId);

  if (error) return { error: error.message };
  return { ok: true };
}

export async function deleteQuote(quoteId: string) {
  const { error } = await supabaseAdmin
    .from('quotes')
    .delete()
    .eq('id', quoteId);

  if (error) return { error: error.message };
  return { ok: true };
}

// ─── Commandes ──────────────────────────────────────────────────────────────

export async function updateOrderStatut(orderId: string, statut: string) {
  const VALID = ['en_attente', 'commande_fournisseur', 'en_production', 'bat_envoye', 'bat_valide', 'en_marquage', 'expedie', 'livre'];
  if (!VALID.includes(statut)) return { error: 'Statut invalide' };

  // Mettre à jour + récupérer la commande avec le client
  const { error } = await supabaseAdmin
    .from('orders')
    .update({ statut, updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (error) return { error: error.message };

  // Envoyer email au client si le statut est notable
  const NOTIFY_STATUTS = ['en_production', 'expedie', 'livre'];
  if (NOTIFY_STATUTS.includes(statut)) {
    notifyClientStatutChange(orderId, statut).catch(console.error);
  }

  return { ok: true };
}

export async function updateOrderTracking(orderId: string, trackingNumber: string, trackingUrl: string) {
  const { error } = await supabaseAdmin
    .from('orders')
    .update({ tracking_number: trackingNumber, tracking_url: trackingUrl })
    .eq('id', orderId);
  if (error) return { error: error.message };
  return { ok: true };
}

async function notifyClientStatutChange(orderId: string, statut: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, client_id, montant_ttc, tracking_url, tracking_number')
    .eq('id', orderId)
    .single();
  if (!order?.client_id) return;

  const { data: client } = await supabaseAdmin
    .from('clients')
    .select('email, nom')
    .eq('id', order.client_id)
    .single();
  if (!client?.email) return;

  const { Resend } = await import('resend');
  const resend = new Resend(apiKey);

  const STATUT_MESSAGES: Record<string, { subject: string; body: string }> = {
    en_production: {
      subject: 'Votre commande est en production',
      body: 'Bonne nouvelle ! Votre commande a été validée et est maintenant en cours de production. Nous vous tiendrons informé(e) de l\'avancement.',
    },
    expedie: {
      subject: 'Votre commande a été expédiée',
      body: `Votre commande est en route ! ${order.tracking_url ? `<a href="${order.tracking_url}" style="color:#171717;font-weight:bold;">Suivre mon colis${order.tracking_number ? ` (${order.tracking_number})` : ''}</a>` : 'Vous recevrez un numéro de suivi par email.'}`,
    },
    livre: {
      subject: 'Votre commande a été livrée',
      body: 'Votre commande a bien été livrée. Nous espérons que tout vous convient ! N\'hésitez pas à nous contacter si vous avez la moindre question.',
    },
  };

  const msg = STATUT_MESSAGES[statut];
  if (!msg) return;

  await resend.emails.send({
    from: 'Toque2Me <commandes@toque2me.com>',
    to: client.email,
    subject: `${msg.subject} — Toque2Me`,
    html: `
<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" style="background:#f4f4f5;padding:32px 0;"><tr><td align="center">
    <table width="600" style="background:#fff;border-radius:8px;overflow:hidden;">
      <tr><td style="background:#171717;padding:20px 24px;"><h1 style="margin:0;color:#fff;font-size:18px;">Toque2Me</h1></td></tr>
      <tr><td style="padding:24px;">
        <p style="margin:0 0 12px;font-size:16px;color:#333;">Bonjour ${client.nom || ''},</p>
        <p style="margin:0 0 16px;font-size:14px;color:#333;">${msg.body}</p>
        <p style="margin:16px 0 0;font-size:13px;"><a href="https://toque2me.com/espace-client" style="color:#171717;font-weight:bold;">Voir ma commande →</a></p>
      </td></tr>
      <tr><td style="background:#f9fafb;padding:12px 24px;text-align:center;"><p style="margin:0;font-size:11px;color:#999;">Toque2Me — Textile pro personnalisé</p></td></tr>
    </table>
  </td></tr></table>
</body></html>`,
  });
}

// ─── Clients ────────────────────────────────────────────────────────────────

export async function deleteClient(clientId: string) {
  const { error } = await supabaseAdmin
    .from('clients')
    .delete()
    .eq('id', clientId);

  if (error) return { error: error.message };
  return { ok: true };
}
