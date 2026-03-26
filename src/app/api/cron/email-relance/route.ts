import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { Resend } from 'resend';

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ statut: 'skip', details: 'RESEND_API_KEY non configurée' });
  }

  const start = Date.now();
  const resend = new Resend(process.env.RESEND_API_KEY);
  let nbEnvoyes = 0;
  let nbErreurs = 0;
  const erreurs: string[] = [];

  try {
    const now = Date.now();
    const j3 = new Date(now - 3 * 24 * 60 * 60 * 1000);
    const j3Debut = new Date(j3.getTime() - 24 * 60 * 60 * 1000).toISOString(); // fenêtre J+3 ± 24h
    const j3Fin = j3.toISOString();

    const j7 = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const j7Debut = new Date(j7.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const j7Fin = j7.toISOString();

    // J+3 : relance douce — devis brouillon créés il y a ~3 jours, nb_relances = 0
    const { data: quotesJ3, error: errJ3 } = await supabaseAdmin
      .from('quotes')
      .select('id, share_token, total_ht, created_at, client_id, nb_relances, clients(email, nom)')
      .eq('statut', 'brouillon')
      .gte('created_at', j3Debut)
      .lte('created_at', j3Fin)
      .or('nb_relances.is.null,nb_relances.eq.0')
      .limit(10);

    if (errJ3) throw errJ3;

    // J+7 : relance finale — devis brouillon créés il y a ~7 jours, nb_relances = 1
    const { data: quotesJ7, error: errJ7 } = await supabaseAdmin
      .from('quotes')
      .select('id, share_token, total_ht, created_at, client_id, nb_relances, clients(email, nom)')
      .eq('statut', 'brouillon')
      .gte('created_at', j7Debut)
      .lte('created_at', j7Fin)
      .eq('nb_relances', 1)
      .limit(10);

    if (errJ7) throw errJ7;

    const taches: { quote: typeof quotesJ3 extends (infer T)[] | null ? T : never; type: 'j3' | 'j7' }[] = [];

    if (quotesJ3) {
      for (const q of quotesJ3) taches.push({ quote: q, type: 'j3' });
    }
    if (quotesJ7) {
      for (const q of quotesJ7) taches.push({ quote: q, type: 'j7' });
    }

    // Respecter la limite globale de 10
    const batch = taches.slice(0, 10);

    for (const { quote, type } of batch) {
      const client = quote.clients as unknown as { email: string; nom: string } | null;
      if (!client?.email) {
        erreurs.push(`Devis ${quote.id}: pas d'email client`);
        nbErreurs++;
        continue;
      }

      const lienDevis = `https://toque2me.fr/devis/${quote.share_token}`;
      const subject = type === 'j3'
        ? 'Votre devis Toque2Me vous attend'
        : 'Dernière chance — votre devis expire bientôt';

      try {
        await resend.emails.send({
          from: 'Toque2Me <devis@toque2me.fr>',
          to: client.email,
          subject,
          html: buildRelanceEmail(quote, client, type, lienDevis),
        });

        const currentRelances = quote.nb_relances ?? 0;
        await supabaseAdmin
          .from('quotes')
          .update({ nb_relances: currentRelances + 1 })
          .eq('id', quote.id);

        nbEnvoyes++;
      } catch (emailErr: unknown) {
        const msg = emailErr instanceof Error ? emailErr.message : String(emailErr);
        erreurs.push(`Devis ${quote.id}: ${msg}`);
        nbErreurs++;
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    erreurs.push(msg);
    nbErreurs++;
  }

  const statut = nbErreurs > 0 ? (nbEnvoyes > 0 ? 'partiel' : 'erreur') : 'ok';
  await logResult(statut, nbEnvoyes, nbErreurs, erreurs.length > 0 ? erreurs.join(' | ') : null);

  return NextResponse.json({
    statut,
    envoyes: nbEnvoyes,
    erreurs: nbErreurs,
    details: erreurs.length > 0 ? erreurs : undefined,
    duree_ms: Date.now() - start,
  });
}

// ─── Email HTML ──────────────────────────────────────────────────────────────

function buildRelanceEmail(
  quote: { id: string; total_ht: number },
  client: { nom: string },
  type: 'j3' | 'j7',
  lienDevis: string,
) {
  const totalFormate = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(quote.total_ht);

  const titre = type === 'j3'
    ? 'Votre devis vous attend'
    : 'Dernière chance pour votre devis';

  const message = type === 'j3'
    ? `Nous avons préparé votre devis <strong>n°${quote.id}</strong> d'un montant de <strong>${totalFormate} HT</strong>. Il n'attend plus que votre validation !`
    : `Votre devis <strong>n°${quote.id}</strong> d'un montant de <strong>${totalFormate} HT</strong> expire dans quelques jours. Passé le délai de 30 jours, il ne sera plus valable et les tarifs pourront évoluer.`;

  const cta = type === 'j3' ? 'Consulter mon devis' : 'Valider avant expiration';

  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
        <tr>
          <td style="background:${type === 'j3' ? '#dc2626' : '#b91c1c'};padding:24px 32px;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;">Toque2Me</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;font-size:16px;color:#333;">Bonjour ${client.nom},</p>
            <h2 style="margin:0 0 16px;font-size:20px;color:#111;">${titre}</h2>
            <p style="margin:0 0 24px;font-size:16px;color:#333;">${message}</p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
              <tr>
                <td style="background:#dc2626;border-radius:6px;padding:14px 28px;">
                  <a href="${lienDevis}" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;">
                    ${cta}
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:13px;color:#888;">
              ${type === 'j7' ? 'Ce devis expire sous 30 jours à compter de sa création.' : 'Besoin d\'aide ? Répondez directement à cet email.'}
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:16px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#999;">Toque2Me — Objets publicitaires sur mesure</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Log en base ─────────────────────────────────────────────────────────────

async function logResult(statut: string, nbEnvoyes: number, nbErreurs: number, details: string | null) {
  await supabaseAdmin.from('sync_logs').insert({
    fournisseur: 'email-relance',
    nb_produits_traites: nbEnvoyes,
    nb_produits_nouveaux: 0,
    nb_erreurs: nbErreurs,
    statut,
    details,
  });
}
