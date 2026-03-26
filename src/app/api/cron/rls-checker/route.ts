import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const CRITICAL_TABLES = ['products', 'quotes', 'clients', 'margins', 'prices'];

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();

  // ─── Query pg_tables for RLS status ───────────────────────────────────────

  const { data: tables, error: queryError } = await supabaseAdmin
    .from('pg_tables' as never)
    .select('tablename, rowsecurity')
    .eq('schemaname', 'public');

  // Fallback: use raw SQL via rpc if the above doesn't work
  let rows: { tablename: string; rowsecurity: boolean }[] = [];

  if (queryError || !tables) {
    // Use raw SQL query through Supabase
    const { data: sqlResult, error: sqlError } = await supabaseAdmin
      .rpc('exec_sql', {
        query: "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'",
      });

    if (sqlError) {
      // Last resort: direct PostgreSQL query via REST
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          },
          body: JSON.stringify({
            query: "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'",
          }),
        }
      );

      if (res.ok) {
        rows = await res.json();
      } else {
        await supabaseAdmin.from('sync_logs').insert({
          fournisseur: 'rls-check',
          nb_produits_traites: 0,
          nb_produits_nouveaux: 0,
          nb_erreurs: 1,
          statut: 'erreur',
          details: `Impossible de requêter pg_tables: ${sqlError?.message ?? res.statusText}`,
        });

        return NextResponse.json({
          statut: 'erreur',
          error: 'Impossible de requêter pg_tables. Assurez-vous que la fonction exec_sql existe.',
          duree_ms: Date.now() - start,
        });
      }
    } else {
      rows = sqlResult as { tablename: string; rowsecurity: boolean }[];
    }
  } else {
    rows = tables as unknown as { tablename: string; rowsecurity: boolean }[];
  }

  // ─── Classify tables ─────────────────────────────────────────────────────

  const secure: string[] = [];
  const insecure: string[] = [];
  const critical_exposed: string[] = [];

  for (const row of rows) {
    if (row.rowsecurity) {
      secure.push(row.tablename);
    } else {
      insecure.push(row.tablename);
      if (CRITICAL_TABLES.includes(row.tablename)) {
        critical_exposed.push(row.tablename);
      }
    }
  }

  // ─── Log to sync_logs ─────────────────────────────────────────────────────

  const statut = critical_exposed.length > 0 ? 'erreur' : 'ok';

  await supabaseAdmin.from('sync_logs').insert({
    fournisseur: 'rls-check',
    nb_produits_traites: rows.length,
    nb_produits_nouveaux: 0,
    nb_erreurs: critical_exposed.length,
    statut,
    details: JSON.stringify({
      secure: secure.length,
      insecure: insecure.length,
      critical_exposed,
    }),
  });

  return NextResponse.json({
    statut,
    secure,
    insecure,
    critical_exposed,
    duree_ms: Date.now() - start,
  });
}
