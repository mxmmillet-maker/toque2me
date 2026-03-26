import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';

const KEY_PACKAGES = ['next', 'react', '@supabase/supabase-js', '@anthropic-ai/sdk'];

interface DepStatus {
  package: string;
  current: string;
  latest: string;
  majorsBehind: number;
}

function parseMajor(version: string): number {
  // Remove ^, ~, >= etc. and parse major
  const clean = version.replace(/^[\^~>=<]+/, '');
  return parseInt(clean.split('.')[0], 10);
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();

  // ─── Read package.json ────────────────────────────────────────────────────

  let pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
  try {
    const raw = readFileSync(join(process.cwd(), 'package.json'), 'utf-8');
    pkg = JSON.parse(raw);
  } catch {
    return NextResponse.json({ statut: 'erreur', error: 'Impossible de lire package.json' });
  }

  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

  // ─── Check each key package against npm registry ──────────────────────────

  const up_to_date: DepStatus[] = [];
  const outdated: DepStatus[] = [];
  const critical: DepStatus[] = [];

  for (const name of KEY_PACKAGES) {
    const currentSpec = allDeps[name];
    if (!currentSpec) continue;

    try {
      // Encode scoped packages: @supabase/supabase-js → @supabase%2Fsupabase-js
      const encodedName = name.replace('/', '%2F');
      const res = await fetch(`https://registry.npmjs.org/${encodedName}/latest`);
      if (!res.ok) continue;

      const data = await res.json();
      const latestVersion: string = data.version;
      const currentMajor = parseMajor(currentSpec);
      const latestMajor = parseMajor(latestVersion);
      const majorsBehind = latestMajor - currentMajor;

      const entry: DepStatus = {
        package: name,
        current: currentSpec,
        latest: latestVersion,
        majorsBehind,
      };

      if (majorsBehind >= 2) {
        critical.push(entry);
      } else if (majorsBehind >= 1) {
        outdated.push(entry);
      } else {
        up_to_date.push(entry);
      }
    } catch {
      // Skip packages we can't check
    }
  }

  // ─── Log to sync_logs ─────────────────────────────────────────────────────

  const statut = critical.length > 0 ? 'erreur' : 'ok';

  await supabaseAdmin.from('sync_logs').insert({
    fournisseur: 'dep-audit',
    nb_produits_traites: up_to_date.length + outdated.length + critical.length,
    nb_produits_nouveaux: 0,
    nb_erreurs: critical.length,
    statut,
    details: JSON.stringify({
      up_to_date: up_to_date.length,
      outdated: outdated.length,
      critical: critical.map((c) => `${c.package} (${c.current} → ${c.latest})`),
    }),
  });

  return NextResponse.json({
    statut,
    up_to_date,
    outdated,
    critical,
    duree_ms: Date.now() - start,
  });
}
