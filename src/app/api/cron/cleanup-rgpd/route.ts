import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();

  // Supprimer les devis expirés (> 90 jours sans activité)
  const { count: devisSupprimes, error: errDevis } = await supabaseAdmin
    .from('quotes')
    .delete({ count: 'exact' })
    .lt('updated_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
    .eq('statut', 'brouillon');

  // Supprimer les sync_logs de plus de 30 jours
  const { count: logsSupprimes, error: errLogs } = await supabaseAdmin
    .from('sync_logs')
    .delete({ count: 'exact' })
    .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const error = errDevis || errLogs;

  return NextResponse.json({
    statut: error ? 'erreur' : 'ok',
    devis_supprimes: devisSupprimes ?? 0,
    logs_supprimes: logsSupprimes ?? 0,
    details: error?.message,
    duree_ms: Date.now() - start,
  });
}
