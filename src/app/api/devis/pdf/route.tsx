import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 });

  const { data: quote } = await supabase
    .from('quotes')
    .select('*')
    .eq('share_token', token)
    .single();

  if (!quote) return NextResponse.json({ error: 'quote not found' }, { status: 404 });

  const lignes = quote.lignes || [];
  const totalHt = Number(quote.total_ht);
  const tva = Math.ceil(totalHt * 0.2 * 100) / 100;
  const totalTtc = Math.ceil(totalHt * 1.2 * 100) / 100;
  const validite = new Date(quote.created_at);
  validite.setDate(validite.getDate() + 30);
  const dateStr = new Date(quote.created_at).toLocaleDateString('fr-FR');
  const validiteStr = validite.toLocaleDateString('fr-FR');

  const lignesHtml = lignes.map((l: any) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f5f5f5">
        <strong>${l.nom}</strong><br>
        <span style="color:#999;font-size:12px">Réf. ${l.ref}${l.categorie ? ' — ' + l.categorie : ''}</span>
      </td>
      <td style="padding:8px 0;border-bottom:1px solid #f5f5f5;text-align:center">${l.qty}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f5f5f5;text-align:right">${l.prix_unitaire_ht.toFixed(2)} €</td>
      <td style="padding:8px 0;border-bottom:1px solid #f5f5f5;text-align:right">${l.total_ligne_ht.toFixed(2)} €</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Devis Toque2Me</title>
<style>
  body{font-family:Helvetica,Arial,sans-serif;color:#1a1a1a;max-width:700px;margin:40px auto;padding:0 20px;font-size:14px}
  table{width:100%;border-collapse:collapse}
  th{text-align:left;color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px;border-bottom:2px solid #eee}
  .totals{margin-top:20px;text-align:right}
  .totals td{padding:4px 0}
  .total-ttc{font-size:18px;font-weight:bold;border-top:2px solid #1a1a1a;padding-top:8px}
  .share{margin-top:30px;padding:15px;background:#fafafa;border-radius:8px;text-align:center;font-size:12px;color:#999}
  .footer{margin-top:40px;padding-top:20px;border-top:1px solid #eee;text-align:center;font-size:11px;color:#999}
  @media print{body{margin:0;padding:20px}.share{display:none}}
</style></head><body>
<div style="display:flex;justify-content:space-between;margin-bottom:30px">
  <div><h1 style="margin:0;font-size:24px">TOQUE2ME</h1><p style="color:#999;font-size:12px;margin:4px 0">Textile & objets personnalisés pour professionnels</p></div>
  <div style="text-align:right;color:#999;font-size:13px">
    <p style="margin:2px 0">Devis N° ${quote.id.slice(0, 8).toUpperCase()}</p>
    <p style="margin:2px 0">Date : ${dateStr}</p>
    <p style="margin:2px 0">Validité : ${validiteStr}</p>
  </div>
</div>

<table>
  <thead><tr>
    <th style="width:50%">Désignation</th>
    <th style="text-align:center">Qté</th>
    <th style="text-align:right">P.U. HT</th>
    <th style="text-align:right">Total HT</th>
  </tr></thead>
  <tbody>${lignesHtml}</tbody>
</table>

<table class="totals">
  <tr><td style="color:#999">Total HT</td><td style="font-weight:600">${totalHt.toFixed(2)} €</td></tr>
  <tr><td style="color:#999">TVA (20%)</td><td style="font-weight:600">${tva.toFixed(2)} €</td></tr>
  <tr class="total-ttc"><td>Total TTC</td><td>${totalTtc.toFixed(2)} €</td></tr>
</table>

<div class="share">
  Partagez ce devis : <strong>toque2me.fr/devis/${token}</strong>
</div>

<div class="footer">
  <p>TOQUE2ME — Textile & objets personnalisés pour professionnels</p>
  <p>Devis valable 30 jours — Prix en euros, TVA 20%</p>
</div>

<script>window.onload=function(){window.print()}</script>
</body></html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
