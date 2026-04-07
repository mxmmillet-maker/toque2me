import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const BASE_URL = 'https://toque2me.com';
const SITEMAP_URL = `${BASE_URL}/sitemap.xml`;

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();
  const results: string[] = [];
  let nbErreurs = 0;

  // Ping Google
  try {
    const res = await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`);
    results.push(`Google: ${res.status}`);
    if (!res.ok) nbErreurs++;
  } catch (e: any) {
    results.push(`Google: erreur — ${e.message}`);
    nbErreurs++;
  }

  // Ping Bing
  try {
    const res = await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`);
    results.push(`Bing: ${res.status}`);
    if (!res.ok) nbErreurs++;
  } catch (e: any) {
    results.push(`Bing: erreur — ${e.message}`);
    nbErreurs++;
  }

  // IndexNow (Bing/Yandex instant indexing)
  if (process.env.INDEXNOW_KEY) {
    try {
      const res = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: 'toque2me.com',
          key: process.env.INDEXNOW_KEY,
          keyLocation: `${BASE_URL}/${process.env.INDEXNOW_KEY}.txt`,
          urlList: [
            BASE_URL,
            `${BASE_URL}/catalogue`,
            `${BASE_URL}/configurateur`,
            `${BASE_URL}/restaurateurs`,
            `${BASE_URL}/btp`,
            SITEMAP_URL,
          ],
        }),
      });
      results.push(`IndexNow: ${res.status}`);
      if (!res.ok) nbErreurs++;
    } catch (e: any) {
      results.push(`IndexNow: erreur — ${e.message}`);
      nbErreurs++;
    }
  } else {
    results.push('IndexNow: ignoré (INDEXNOW_KEY non définie)');
  }

  const statut = nbErreurs === 0 ? 'ok' : nbErreurs < results.length ? 'partiel' : 'erreur';

  // Log en base
  await supabaseAdmin.from('sync_logs').insert({
    fournisseur: 'seo-ping',
    nb_produits_traites: results.length,
    nb_produits_nouveaux: 0,
    nb_erreurs: nbErreurs,
    statut,
    details: results.join(' | '),
  });

  return NextResponse.json({
    statut,
    pings: results,
    duree_ms: Date.now() - start,
  });
}
