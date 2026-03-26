import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const BASE_URL = 'https://toque2me.fr';

const REQUIRED_HEADERS: Record<string, (value: string | null) => boolean> = {
  'x-content-type-options': (v) => v === 'nosniff',
  'x-frame-options': (v) => v === 'DENY' || v === 'SAMEORIGIN',
  'strict-transport-security': (v) => !!v,
  'content-security-policy': (v) => !!v,
  'referrer-policy': (v) => !!v,
  'x-xss-protection': (v) => !!v,
};

const PAGES_TO_CHECK = ['/', '/catalogue', '/devis'];

interface AuditEntry {
  check: string;
  detail?: string;
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();
  const passed: AuditEntry[] = [];
  const failed: AuditEntry[] = [];
  const warnings: AuditEntry[] = [];

  // ─── 1. Check HTTP security headers on key pages ──────────────────────────

  for (const page of PAGES_TO_CHECK) {
    try {
      const res = await fetch(`${BASE_URL}${page}`, { method: 'HEAD' });
      for (const [header, validate] of Object.entries(REQUIRED_HEADERS)) {
        const value = res.headers.get(header);
        if (validate(value)) {
          passed.push({ check: `${page} → ${header}`, detail: value ?? undefined });
        } else {
          failed.push({ check: `${page} → ${header}`, detail: value ?? 'absent' });
        }
      }
    } catch (err) {
      warnings.push({ check: `${page} → fetch failed`, detail: String(err) });
    }
  }

  // ─── 2. Check that protected API endpoints return 401 without auth ────────

  const protectedEndpoints = [
    '/api/admin/margins',
    '/api/cron/sync-cybernecard',
  ];

  for (const endpoint of protectedEndpoints) {
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`);
      if (res.status === 401) {
        passed.push({ check: `${endpoint} → 401 sans auth` });
      } else {
        failed.push({ check: `${endpoint} → attendu 401, reçu ${res.status}` });
      }
    } catch (err) {
      warnings.push({ check: `${endpoint} → fetch failed`, detail: String(err) });
    }
  }

  // ─── 3. Check that .env is not exposed ────────────────────────────────────

  try {
    const res = await fetch(`${BASE_URL}/.env`);
    if (res.status === 404) {
      passed.push({ check: '/.env → 404 (non exposé)' });
    } else {
      failed.push({ check: `/.env → attendu 404, reçu ${res.status}` });
    }
  } catch (err) {
    warnings.push({ check: '/.env → fetch failed', detail: String(err) });
  }

  // ─── 4. Check that API errors don't leak stack traces ─────────────────────

  const errorEndpoints = ['/api/admin/margins', '/api/cron/sync-cybernecard'];

  for (const endpoint of errorEndpoints) {
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`);
      const text = await res.text();
      const lower = text.toLowerCase();
      if (lower.includes('stack') || lower.includes('trace')) {
        failed.push({ check: `${endpoint} → fuite stack trace détectée` });
      } else {
        passed.push({ check: `${endpoint} → pas de fuite stack trace` });
      }
    } catch (err) {
      warnings.push({ check: `${endpoint} → stack trace check failed`, detail: String(err) });
    }
  }

  // ─── Log to sync_logs ─────────────────────────────────────────────────────

  const statut = failed.length > 0 ? 'erreur' : 'ok';

  await supabaseAdmin.from('sync_logs').insert({
    fournisseur: 'security',
    nb_produits_traites: passed.length + failed.length + warnings.length,
    nb_produits_nouveaux: 0,
    nb_erreurs: failed.length,
    statut,
    details: JSON.stringify({ passed: passed.length, failed: failed.length, warnings: warnings.length }),
  });

  return NextResponse.json({
    statut,
    passed,
    failed,
    warnings,
    duree_ms: Date.now() - start,
  });
}
