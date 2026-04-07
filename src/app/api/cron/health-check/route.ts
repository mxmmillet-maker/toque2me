import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const BASE_URL = 'https://toque2me.com';

interface CheckResult {
  route: string;
  expected_status: number;
  actual_status: number | null;
  response_ms: number;
  ok: boolean;
  error?: string;
}

const ROUTES_TO_CHECK: { route: string; method: string; expected: number }[] = [
  { route: '/', method: 'GET', expected: 200 },
  { route: '/catalogue', method: 'GET', expected: 200 },
  { route: '/configurateur', method: 'GET', expected: 200 },
  { route: '/restaurateurs', method: 'GET', expected: 200 },
  { route: '/btp', method: 'GET', expected: 200 },
  { route: '/sitemap.xml', method: 'GET', expected: 200 },
  { route: '/robots.txt', method: 'GET', expected: 200 },
  { route: '/api/cron/sync-cybernecard', method: 'GET', expected: 401 },
  { route: '/api/pricing', method: 'POST', expected: -1 }, // any non-500
];

async function checkRoute(
  route: string,
  method: string,
  expectedStatus: number,
): Promise<CheckResult> {
  const url = `${BASE_URL}${route}`;
  const start = Date.now();

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      ...(method === 'POST' ? { body: JSON.stringify({}) } : {}),
    });

    const responseMs = Date.now() - start;
    const actualStatus = res.status;

    // For /api/pricing we accept anything that isn't a 500
    const ok =
      expectedStatus === -1
        ? actualStatus < 500
        : actualStatus === expectedStatus;

    return {
      route,
      expected_status: expectedStatus,
      actual_status: actualStatus,
      response_ms: responseMs,
      ok: ok && responseMs <= 5000,
      ...(responseMs > 5000 ? { error: `Slow response: ${responseMs}ms` } : {}),
      ...(!ok ? { error: `Expected ${expectedStatus === -1 ? '<500' : expectedStatus}, got ${actualStatus}` } : {}),
    };
  } catch (err) {
    return {
      route,
      expected_status: expectedStatus,
      actual_status: null,
      response_ms: Date.now() - start,
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

async function sendAlertEmail(failingChecks: CheckResult[]) {
  const resendKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!resendKey || !adminEmail) return;

  const body = failingChecks
    .map(
      (c) =>
        `• ${c.route} — status: ${c.actual_status ?? 'N/A'} (attendu: ${c.expected_status === -1 ? '<500' : c.expected_status}) — ${c.response_ms}ms${c.error ? ` — ${c.error}` : ''}`,
    )
    .join('\n');

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Toque2Me Ops <ops@toque2me.com>',
      to: adminEmail,
      subject: '🚨 Toque2Me — Page(s) down',
      text: `Les pages suivantes sont en erreur :\n\n${body}\n\nVérifié le ${new Date().toISOString()}`,
    }),
  });
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();

  const checks = await Promise.all(
    ROUTES_TO_CHECK.map((r) => checkRoute(r.route, r.method, r.expected)),
  );

  const failing = checks.filter((c) => !c.ok);
  const allDown = checks.every((c) => !c.ok);
  const status = allDown ? 'down' : failing.length > 0 ? 'degraded' : 'healthy';
  const avgResponseMs = Math.round(
    checks.reduce((sum, c) => sum + c.response_ms, 0) / checks.length,
  );

  // Send alert email if any critical page is down
  if (failing.length > 0) {
    await sendAlertEmail(failing).catch(console.error);
  }

  // Log to sync_logs
  await supabaseAdmin.from('sync_logs').insert({
    fournisseur: 'health-check',
    nb_produits_traites: checks.length,
    nb_produits_nouveaux: 0,
    nb_erreurs: failing.length,
    statut: status,
    details: failing.length > 0
      ? `Failing: ${failing.map((c) => c.route).join(', ')}`
      : `All ${checks.length} routes healthy — avg ${avgResponseMs}ms`,
  });

  const result = {
    status,
    checks,
    avg_response_ms: avgResponseMs,
    duree_ms: Date.now() - start,
  };

  console.log(`[health-check] ${status.toUpperCase()} — ${checks.length} routes, ${failing.length} erreurs, avg ${avgResponseMs}ms`);

  return NextResponse.json(result);
}
