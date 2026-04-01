import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Health check + métriques — appelé par Vercel Cron ou monitoring externe
export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. Derniers sync logs — détecter les erreurs
  const { data: recentSyncs } = await supabase
    .from('sync_logs')
    .select('fournisseur, statut, nb_erreurs, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  const failedSyncs = (recentSyncs || []).filter((s) => s.statut === 'erreur');

  // 2. Stats devis
  const { count: totalQuotes } = await supabase
    .from('quotes')
    .select('*', { count: 'exact', head: true });

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: quotesToday } = await supabase
    .from('quotes')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneDayAgo);

  // 3. Produits actifs
  const { count: activeProducts } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('actif', true);

  const { count: totalProducts } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  // 4. Alertes
  const alerts: string[] = [];
  if (failedSyncs.length > 0) {
    alerts.push(`${failedSyncs.length} sync(s) en erreur : ${failedSyncs.map((s) => s.fournisseur).join(', ')}`);
  }

  // Alerte si aucun sync depuis 48h
  const latestSync = recentSyncs?.[0];
  if (latestSync) {
    const lastSyncAge = Date.now() - new Date(latestSync.created_at).getTime();
    if (lastSyncAge > 48 * 60 * 60 * 1000) {
      alerts.push('Aucun sync depuis plus de 48h');
    }
  }

  return NextResponse.json({
    status: alerts.length === 0 ? 'healthy' : 'warning',
    alerts,
    metrics: {
      products: { total: totalProducts, active: activeProducts },
      quotes: { total: totalQuotes, last24h: quotesToday },
      syncs: {
        recent: recentSyncs?.slice(0, 5),
        failures: failedSyncs.length,
      },
    },
    timestamp: new Date().toISOString(),
  });
}
