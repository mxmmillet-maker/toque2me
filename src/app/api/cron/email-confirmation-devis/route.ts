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
    // Récupérer les devis créés dans les dernières 24h non encore envoyés par email
    const il_y_a_24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: quotes, error: fetchError } = await supabaseAdmin
      .from('quotes')
      .select('id, share_token, total_ht, created_at, client_id, clients(email, nom)')
      .gte('created_at', il_y_a_24h)
      .or('email_envoye.is.null,email_envoye.eq.false')
      .limit(20);

    if (fetchError) throw fetchError;
    if (!quotes || quotes.length === 0) {
      await logResult('ok', 0, 0, 'Aucun devis à envoyer');
      return NextResponse.json({ statut: 'ok', envoyes: 0, duree_ms: Date.now() - start });
    }

    for (const quote of quotes) {
      const client = quote.clients as unknown as { email: string; nom: string } | null;
      if (!client?.email) {
        erreurs.push(`Devis ${quote.id}: pas d'email client`);
        nbErreurs++;
        continue;
      }

      try {
        await resend.emails.send({
          from: 'Toque2Me <devis@toque2me.fr>',
          to: client.email,
          subject: `Votre devis Toque2Me n°${quote.id} est prêt`,
          html: buildConfirmationEmail(quote, client),
        });

        await supabaseAdmin
          .from('quotes')
          .update({ email_envoye: true })
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

function buildConfirmationEmail(
  quote: { id: string; share_token: string; total_ht: number },
  client: { nom: string },
) {
  const lienDevis = `https://toque2me.fr/devis/${quote.share_token}`;
  const totalFormate = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(quote.total_ht);

  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
        <tr>
          <td style="background:#dc2626;padding:24px 32px;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;">Toque2Me</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;font-size:16px;color:#333;">Bonjour ${client.nom},</p>
            <p style="margin:0 0 16px;font-size:16px;color:#333;">
              Votre devis <strong>n°${quote.id}</strong> d'un montant de <strong>${totalFormate} HT</strong> est prêt.
            </p>
            <p style="margin:0 0 24px;font-size:16px;color:#333;">
              Vous pouvez le consulter et l'accepter en cliquant sur le bouton ci-dessous :
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
              <tr>
                <td style="background:#dc2626;border-radius:6px;padding:14px 28px;">
                  <a href="${lienDevis}" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;">
                    Voir mon devis
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:13px;color:#888;">
              Ce devis est valable 30 jours. Si vous avez des questions, répondez directement à cet email.
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
    fournisseur: 'email-devis',
    nb_produits_traites: nbEnvoyes,
    nb_produits_nouveaux: 0,
    nb_erreurs: nbErreurs,
    statut,
    details,
  });
}
