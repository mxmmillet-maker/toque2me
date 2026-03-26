import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(';').map((h) => h.trim().toLowerCase());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(';').map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? '';
    });
    rows.push(row);
  }

  return rows;
}

function isTruthy(value: string): boolean {
  return ['true', '1', 'oui'].includes(value.toLowerCase());
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();
  let processed = 0;
  let updated = 0;
  let errors = 0;
  let skipped = 0;

  try {
    // List files in the 'imports' bucket root
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from('imports')
      .list('', { limit: 10, sortBy: { column: 'created_at', order: 'desc' } });

    if (listError) throw listError;

    // Find the most recent products-*.csv file
    const csvFile = files?.find(
      (f) => f.name.startsWith('products-') && f.name.endsWith('.csv'),
    );

    if (!csvFile) {
      // Nothing to process
      await supabaseAdmin.from('sync_logs').insert({
        fournisseur: 'import-csv',
        nb_produits_traites: 0,
        nb_produits_nouveaux: 0,
        nb_erreurs: 0,
        statut: 'ok',
        details: 'Aucun fichier CSV trouvé',
      });

      return NextResponse.json({
        processed: 0,
        updated: 0,
        errors: 0,
        skipped: 0,
        details: 'Aucun fichier CSV trouvé',
        duree_ms: Date.now() - start,
      });
    }

    const fileName = csvFile.name;

    // Download the CSV file
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('imports')
      .download(fileName);

    if (downloadError || !fileData) throw downloadError ?? new Error('Fichier vide');

    const text = await fileData.text();
    const rows = parseCSV(text);
    processed = rows.length;

    // Process each row
    for (const row of rows) {
      const ref = row.ref_fournisseur;
      if (!ref) {
        skipped++;
        continue;
      }

      const updates: Record<string, unknown> = {};

      if (row.style) {
        updates.style = row.style;
      }

      if (row.exclu && isTruthy(row.exclu)) {
        updates.exclu = true;
      }

      if (Object.keys(updates).length === 0) {
        skipped++;
        continue;
      }

      const { error: updateError } = await supabaseAdmin
        .from('products')
        .update(updates)
        .eq('ref_fournisseur', ref);

      if (updateError) {
        console.error(`[import-csv] Erreur pour ref ${ref}:`, updateError.message);
        errors++;
      } else {
        updated++;
      }
    }

    // Move the file to processed/ folder
    const { error: moveError } = await supabaseAdmin.storage
      .from('imports')
      .move(fileName, `processed/${fileName}`);

    if (moveError) {
      console.error('[import-csv] Erreur déplacement fichier:', moveError.message);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('[import-csv] Erreur fatale:', message);

    await supabaseAdmin.from('sync_logs').insert({
      fournisseur: 'import-csv',
      nb_produits_traites: processed,
      nb_produits_nouveaux: updated,
      nb_erreurs: errors + 1,
      statut: 'erreur',
      details: message,
    });

    return NextResponse.json(
      { processed, updated, errors: errors + 1, skipped, error: message },
      { status: 500 },
    );
  }

  // Log to sync_logs
  await supabaseAdmin.from('sync_logs').insert({
    fournisseur: 'import-csv',
    nb_produits_traites: processed,
    nb_produits_nouveaux: updated,
    nb_erreurs: errors,
    statut: errors > 0 ? 'partiel' : 'ok',
    details: `${processed} lignes, ${updated} mises à jour, ${skipped} ignorées, ${errors} erreurs`,
  });

  const result = {
    processed,
    updated,
    errors,
    skipped,
    duree_ms: Date.now() - start,
  };

  console.log(
    `[import-csv] ${errors > 0 ? 'PARTIEL' : 'OK'} — ${processed} lignes, ${updated} maj, ${errors} erreurs`,
  );

  return NextResponse.json(result);
}
