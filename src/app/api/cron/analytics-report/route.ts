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

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@toque2me.fr';
  const start = Date.now();
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const il_y_a_7j = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // ── Produits ──────────────────────────────────────────────────────────────
    const [
      { count: totalProduits },
      { count: produitsActifs },
      { count: produitsRecents },
    ] = await Promise.all([
      supabaseAdmin.from('products').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('products').select('*', { count: 'exact', head: true }).eq('actif', true),
      supabaseAdmin.from('products').select('*', { count: 'exact', head: true }).gte('created_at', il_y_a_7j),
    ]);

    // ── Devis ────────────────────────────────────────────────────────────────
    const [
      { count: totalDevis },
      { count: devisRecents },
      { count: devisAcceptes },
    ] = await Promise.all([
      supabaseAdmin.from('quotes').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('quotes').select('*', { count: 'exact', head: true }).gte('created_at', il_y_a_7j),
      supabaseAdmin.from('quotes').select('*', { count: 'exact', head: true }).eq('statut', 'accepte'),
    ]);

    const tauxConversion = totalDevis && totalDevis > 0
      ? ((devisAcceptes ?? 0) / totalDevis * 100).toFixed(1)
      : '0.0';

    // ── Sync erreurs ─────────────────────────────────────────────────────────
    const { count: syncErreurs } = await supabaseAdmin
      .from('sync_logs')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'erreur')
      .gte('created_at', il_y_a_7j);

    // ── Top 5 produits les plus devisés ───────────────────────────────────────
    const { data: topProduits } = await supabaseAdmin
      .from('quote_items')
      .select('product_id, quantity, products(nom)')
      .order('quantity', { ascending: false })
      .limit(50);

    // Agréger manuellement par produit
    const compteur = new Map<string, { nom: string; total: number }>();
    if (topProduits) {
      for (const item of topProduits) {
        const product = item.products as unknown as { nom: string } | null;
        const nom = product?.nom ?? `Produit ${item.product_id}`;
        const entry = compteur.get(item.product_id) ?? { nom, total: 0 };
        entry.total += item.quantity ?? 1;
        compteur.set(item.product_id, entry);
      }
    }
    const top5 = Array.from(compteur.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5)
      .map(([, v]) => v);

    // ── Envoi du rapport ─────────────────────────────────────────────────────
    const dateFormatee = new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    }).format(new Date());

    await resend.emails.send({
      from: 'Toque2Me <devis@toque2me.fr>',
      to: adminEmail,
      subject: `Toque2Me — Rapport hebdo du ${dateFormatee}`,
      html: buildReportEmail({
        totalProduits: totalProduits ?? 0,
        produitsActifs: produitsActifs ?? 0,
        produitsRecents: produitsRecents ?? 0,
        totalDevis: totalDevis ?? 0,
        devisRecents: devisRecents ?? 0,
        tauxConversion,
        syncErreurs: syncErreurs ?? 0,
        top5,
        dateFormatee,
      }),
    });

    await logResult('ok', 1, 0, null);

    return NextResponse.json({
      statut: 'ok',
      rapport_envoye_a: adminEmail,
      duree_ms: Date.now() - start,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await logResult('erreur', 0, 1, msg);
    return NextResponse.json({ statut: 'erreur', details: msg, duree_ms: Date.now() - start });
  }
}

// ─── Email HTML ──────────────────────────────────────────────────────────────

function buildReportEmail(data: {
  totalProduits: number;
  produitsActifs: number;
  produitsRecents: number;
  totalDevis: number;
  devisRecents: number;
  tauxConversion: string;
  syncErreurs: number;
  top5: { nom: string; total: number }[];
  dateFormatee: string;
}) {
  const top5Rows = data.top5.length > 0
    ? data.top5.map((p, i) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#333;">${i + 1}. ${p.nom}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;color:#333;">${p.total}</td>
        </tr>`).join('')
    : '<tr><td colspan="2" style="padding:8px 12px;color:#888;">Aucune donnée</td></tr>';

  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="640" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
        <tr>
          <td style="background:#dc2626;padding:24px 32px;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;">Toque2Me — Rapport hebdomadaire</h1>
            <p style="margin:4px 0 0;color:#fecaca;font-size:14px;">${data.dateFormatee}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">

            <h2 style="margin:0 0 12px;font-size:18px;color:#111;">Catalogue produits</h2>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr style="background:#f9fafb;">
                <td style="padding:8px 12px;font-weight:bold;color:#555;">Métrique</td>
                <td style="padding:8px 12px;font-weight:bold;text-align:right;color:#555;">Valeur</td>
              </tr>
              <tr>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#333;">Total produits</td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;color:#333;">${data.totalProduits}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#333;">Produits actifs</td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;color:#333;">${data.produitsActifs}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#333;">Ajoutés (7 derniers jours)</td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;color:#333;">${data.produitsRecents}</td>
              </tr>
            </table>

            <h2 style="margin:0 0 12px;font-size:18px;color:#111;">Devis</h2>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr style="background:#f9fafb;">
                <td style="padding:8px 12px;font-weight:bold;color:#555;">Métrique</td>
                <td style="padding:8px 12px;font-weight:bold;text-align:right;color:#555;">Valeur</td>
              </tr>
              <tr>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#333;">Total devis</td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;color:#333;">${data.totalDevis}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#333;">Créés (7 derniers jours)</td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;color:#333;">${data.devisRecents}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#333;">Taux de conversion</td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;color:#333;font-weight:bold;">${data.tauxConversion}%</td>
              </tr>
            </table>

            <h2 style="margin:0 0 12px;font-size:18px;color:#111;">Synchronisation fournisseurs</h2>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr style="background:#f9fafb;">
                <td style="padding:8px 12px;font-weight:bold;color:#555;">Métrique</td>
                <td style="padding:8px 12px;font-weight:bold;text-align:right;color:#555;">Valeur</td>
              </tr>
              <tr>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#333;">Erreurs de sync (7 jours)</td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;color:${data.syncErreurs > 0 ? '#dc2626' : '#333'};font-weight:bold;">${data.syncErreurs}</td>
              </tr>
            </table>

            <h2 style="margin:0 0 12px;font-size:18px;color:#111;">Top 5 produits les plus devisés</h2>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr style="background:#f9fafb;">
                <td style="padding:8px 12px;font-weight:bold;color:#555;">Produit</td>
                <td style="padding:8px 12px;font-weight:bold;text-align:right;color:#555;">Quantité</td>
              </tr>
              ${top5Rows}
            </table>

          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:16px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#999;">Rapport automatique — Toque2Me</p>
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
    fournisseur: 'analytics',
    nb_produits_traites: nbEnvoyes,
    nb_produits_nouveaux: 0,
    nb_erreurs: nbErreurs,
    statut,
    details,
  });
}
