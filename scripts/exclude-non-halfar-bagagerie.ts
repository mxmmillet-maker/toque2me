import { config } from 'dotenv';
config({ path: '.env.local' });
import ExcelJS from 'exceljs';
import { supabaseAdmin } from '../src/lib/supabase-admin';

(async () => {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('/Users/mxmmi1/Downloads/Export_halfar_reclassement_V8_1Alex_categorise.xlsx');
  const ws = wb.worksheets[0];

  const halfarCodes = new Set<string>();
  for (let r = 2; r <= ws.rowCount; r++) {
    const code = String((ws.getRow(r).values as any[])[1] || '').trim();
    if (code) halfarCodes.add(code);
  }
  console.log(`${halfarCodes.size} codes Halfar préservés`);

  const { data: bagagerie } = await supabaseAdmin
    .from('products')
    .select('id, ref_fournisseur, nom, fournisseur')
    .eq('categorie', 'Bagagerie')
    .eq('actif', true);

  const toExclude = (bagagerie || []).filter(p => !halfarCodes.has(p.ref_fournisseur));
  console.log(`${toExclude.length} produits non-Halfar à exclure (${bagagerie?.length || 0} total Bagagerie)`);

  // Stats par fournisseur avant
  const f: Record<string, number> = {};
  for (const p of toExclude) f[p.fournisseur || '(null)'] = (f[p.fournisseur || '(null)'] || 0) + 1;
  console.log('Par fournisseur:', f);

  // Update par batch
  let done = 0;
  const batchSize = 200;
  for (let i = 0; i < toExclude.length; i += batchSize) {
    const batch = toExclude.slice(i, i + batchSize);
    await Promise.all(batch.map(p =>
      supabaseAdmin.from('products').update({ exclu: true }).eq('id', p.id)
    ));
    done += batch.length;
    process.stdout.write(`  ${done}/${toExclude.length}\r`);
  }
  console.log(`\n✅ ${done} produits exclus (exclu = true).`);
})();
