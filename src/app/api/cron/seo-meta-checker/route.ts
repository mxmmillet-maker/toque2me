import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const BASE_URL = 'https://toque2me.fr';

const PAGES_TO_CHECK = [
  '/',
  '/catalogue',
  '/configurateur',
  '/restaurateurs',
  '/btp',
  '/btp/electriciens',
  '/btp/chantier',
];

interface PageReport {
  url: string;
  pass: boolean;
  checks: {
    title: { pass: boolean; value?: string; error?: string };
    meta_description: { pass: boolean; value?: string; error?: string };
    og_title: { pass: boolean; value?: string; error?: string };
    og_description: { pass: boolean; value?: string; error?: string };
    canonical: { pass: boolean; value?: string; error?: string };
  };
}

function extractTag(html: string, regex: RegExp): string | null {
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}

async function checkPage(path: string): Promise<PageReport> {
  const url = `${BASE_URL}${path}`;

  const checks: PageReport['checks'] = {
    title: { pass: false },
    meta_description: { pass: false },
    og_title: { pass: false },
    og_description: { pass: false },
    canonical: { pass: false },
  };

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Toque2Me-SEO-Checker/1.0' },
    });

    if (!res.ok) {
      const error = `HTTP ${res.status}`;
      return {
        url,
        pass: false,
        checks: {
          title: { pass: false, error },
          meta_description: { pass: false, error },
          og_title: { pass: false, error },
          og_description: { pass: false, error },
          canonical: { pass: false, error },
        },
      };
    }

    const html = await res.text();

    // <title>
    const title = extractTag(html, /<title[^>]*>([^<]+)<\/title>/i);
    if (!title) {
      checks.title = { pass: false, error: 'Absent' };
    } else if (title.length > 60) {
      checks.title = { pass: false, value: title, error: `Trop long (${title.length} chars)` };
    } else {
      checks.title = { pass: true, value: title };
    }

    // meta description
    const desc = extractTag(html, /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)
      || extractTag(html, /<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i);
    if (!desc) {
      checks.meta_description = { pass: false, error: 'Absente' };
    } else if (desc.length > 160) {
      checks.meta_description = { pass: false, value: desc, error: `Trop longue (${desc.length} chars)` };
    } else {
      checks.meta_description = { pass: true, value: desc };
    }

    // og:title
    const ogTitle = extractTag(html, /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)
      || extractTag(html, /<meta\s+content=["']([^"']+)["']\s+property=["']og:title["']/i);
    if (!ogTitle) {
      checks.og_title = { pass: false, error: 'Absent' };
    } else {
      checks.og_title = { pass: true, value: ogTitle };
    }

    // og:description
    const ogDesc = extractTag(html, /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i)
      || extractTag(html, /<meta\s+content=["']([^"']+)["']\s+property=["']og:description["']/i);
    if (!ogDesc) {
      checks.og_description = { pass: false, error: 'Absente' };
    } else {
      checks.og_description = { pass: true, value: ogDesc };
    }

    // canonical
    const canonical = extractTag(html, /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)
      || extractTag(html, /<link\s+href=["']([^"']+)["']\s+rel=["']canonical["']/i);
    if (!canonical) {
      checks.canonical = { pass: false, error: 'Absent' };
    } else {
      checks.canonical = { pass: true, value: canonical };
    }
  } catch (e: any) {
    const error = `Fetch erreur: ${e.message}`;
    return {
      url,
      pass: false,
      checks: {
        title: { pass: false, error },
        meta_description: { pass: false, error },
        og_title: { pass: false, error },
        og_description: { pass: false, error },
        canonical: { pass: false, error },
      },
    };
  }

  const allPass = Object.values(checks).every((c) => c.pass);

  return { url, pass: allPass, checks };
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();

  const reports: PageReport[] = await Promise.all(
    PAGES_TO_CHECK.map((path) => checkPage(path))
  );

  const warnings = reports.filter((r) => !r.pass);
  const nbErreurs = warnings.length;
  const statut = nbErreurs === 0 ? 'ok' : 'partiel';

  // Build details string with warnings
  const details = warnings
    .map((w) => {
      const issues = Object.entries(w.checks)
        .filter(([, c]) => !c.pass)
        .map(([name, c]) => `${name}: ${c.error}`)
        .join(', ');
      return `${w.url} — ${issues}`;
    })
    .join(' | ');

  // Log en base
  await supabaseAdmin.from('sync_logs').insert({
    fournisseur: 'seo-meta',
    nb_produits_traites: reports.length,
    nb_produits_nouveaux: 0,
    nb_erreurs: nbErreurs,
    statut,
    details: details || 'Toutes les pages sont conformes',
  });

  return NextResponse.json({
    statut,
    pages_verifiees: reports.length,
    pages_ok: reports.length - nbErreurs,
    pages_warning: nbErreurs,
    reports,
    duree_ms: Date.now() - start,
  });
}
