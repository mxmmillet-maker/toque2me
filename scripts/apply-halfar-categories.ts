import { config } from 'dotenv';
config({ path: '.env.local' });
import ExcelJS from 'exceljs';
import { supabaseAdmin } from '../src/lib/supabase-admin';

(async () => {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('/Users/mxmmi1/Downloads/Export_halfar_reclassement_V8_1Alex_categorise.xlsx');
  const ws = wb.worksheets[0];

  const xlsxRows: { code: string; cat: string }[] = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r).values as any[];
    const code = String(row[1] || '').trim();
    const cat = String(row[5] || '').trim();
    if (code) xlsxRows.push({ code, cat });
  }

  const codes = xlsxRows.map(r => r.code);
  const { data: products } = await supabaseAdmin
    .from('products')
    .select('id, ref_fournisseur, tags, categorie')
    .in('ref_fournisseur', codes);

  console.log(`${products?.length || 0} produits Halfar à mettre à jour`);

  const xlsxByCode = new Map(xlsxRows.map(r => [r.code, r.cat]));
  let updated = 0;
  await Promise.all((products || []).map(async (p) => {
    const sousCat = xlsxByCode.get(p.ref_fournisseur) || '';
    const newTags = { ...(p.tags || {}), sous_categorie: sousCat };
    const updates: any = { tags: newTags, categorie: 'Bagagerie' };
    const { error } = await supabaseAdmin.from('products').update(updates).eq('id', p.id);
    if (error) {
      console.error(`  ${p.ref_fournisseur} → ${error.message}`);
    } else {
      updated++;
    }
  }));

  console.log(`✅ ${updated} Halfar mis à jour avec sous-catégorie`);

  // Récap par sous-cat
  const counts: Record<string, number> = {};
  for (const r of xlsxRows) counts[r.cat || '(vide)'] = (counts[r.cat || '(vide)'] || 0) + 1;
  console.log('\nRépartition sous-cat :');
  for (const [c, n] of Object.entries(counts).sort((a,b) => b[1] - a[1])) {
    console.log(`  ${n.toString().padStart(4)} ${c}`);
  }
})();
