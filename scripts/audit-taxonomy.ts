import { config } from 'dotenv';
config({ path: '.env.local' });

import { supabaseAdmin } from '../src/lib/supabase-admin';
import { classifyProduct, TaxonomyResult } from '../src/lib/taxonomy-v2';
import fs from 'fs';
import path from 'path';

interface ProductRow {
  id: string;
  ref_fournisseur: string;
  nom: string;
  description: string | null;
  categorie: string | null;
  fournisseur: string | null;
  genre: string | null;
  composition: string | null;
  marque: string | null;
  actif: boolean;
}

interface AuditRow {
  product: ProductRow;
  result: TaxonomyResult;
}

function csvEscape(s: any): string {
  if (s === null || s === undefined) return '';
  const str = String(s);
  if (/[",\n;]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function toCSV(rows: AuditRow[], onlyAmbigu: boolean): string {
  const headers = [
    'ref',
    'fournisseur',
    'marque',
    'nom',
    'categorie_actuelle',
    'categorie_detectee',
    'sous_categorie_detectee',
    'genre_actuel',
    'genre_detecte',
    'candidats',
    'ambiguites',
    'composition',
    'description_extrait',
  ];
  const out = [headers.join(';')];

  for (const { product, result } of rows) {
    if (onlyAmbigu && result.ambiguites.length === 0) continue;
    const descShort = (product.description || '').slice(0, 240).replace(/\s+/g, ' ');
    out.push([
      product.ref_fournisseur,
      product.fournisseur || '',
      product.marque || '',
      product.nom,
      product.categorie || '',
      result.categorie || '',
      result.sous_categorie || '',
      product.genre || '',
      result.genre || '',
      result.candidats.join('+'),
      result.ambiguites.join(' | '),
      product.composition || '',
      descShort,
    ].map(csvEscape).join(';'));
  }

  return out.join('\n');
}

function buildSummary(rows: AuditRow[]): string {
  const total = rows.length;
  const ambigu = rows.filter(r => r.result.ambiguites.length > 0).length;

  const byAmbiguite = new Map<string, number>();
  const byFournisseurAmbigu = new Map<string, number>();
  const byCatDetectee = new Map<string, number>();
  const reclass = new Map<string, number>();

  for (const { product, result } of rows) {
    for (const a of result.ambiguites) {
      const code = a.split(':')[0].trim();
      byAmbiguite.set(code, (byAmbiguite.get(code) || 0) + 1);
    }
    if (result.ambiguites.length > 0) {
      byFournisseurAmbigu.set(product.fournisseur || '—', (byFournisseurAmbigu.get(product.fournisseur || '—') || 0) + 1);
    }
    const c = result.categorie || '(null)';
    byCatDetectee.set(c, (byCatDetectee.get(c) || 0) + 1);
    const keyReclass = `${product.categorie || '(null)'} → ${result.categorie || '(null)'}`;
    if ((product.categorie || '') !== (result.categorie || '')) {
      reclass.set(keyReclass, (reclass.get(keyReclass) || 0) + 1);
    }
  }

  const sortMap = (m: Map<string, number>) => Array.from(m.entries()).sort((a, b) => b[1] - a[1]);

  let out = `# Audit taxonomie v2\n\n`;
  out += `- Total produits actifs : **${total}**\n`;
  out += `- Cas avec ≥1 ambiguïté : **${ambigu}** (${((ambigu / total) * 100).toFixed(1)}%)\n\n`;

  out += `## Répartition par code d'ambiguïté\n\n`;
  for (const [k, v] of sortMap(byAmbiguite)) out += `- ${k} : ${v}\n`;

  out += `\n## Ambiguïtés par fournisseur\n\n`;
  for (const [k, v] of sortMap(byFournisseurAmbigu)) out += `- ${k} : ${v}\n`;

  out += `\n## Catégories détectées (nouvelle taxo)\n\n`;
  for (const [k, v] of sortMap(byCatDetectee)) out += `- ${k} : ${v}\n`;

  out += `\n## Reclassements (cat actuelle → cat détectée)\n\n`;
  for (const [k, v] of sortMap(reclass)) out += `- ${k} : ${v}\n`;

  return out;
}

async function main() {
  console.log('Chargement des produits actifs (paginé)…');
  const all: ProductRow[] = [];
  const pageSize = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('id, ref_fournisseur, nom, description, categorie, fournisseur, genre, composition, marque, actif')
      .eq('actif', true)
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) {
      console.error('Erreur Supabase:', error.message);
      process.exit(1);
    }
    if (!data || data.length === 0) break;
    all.push(...(data as ProductRow[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }
  if (all.length === 0) {
    console.error('Aucun produit actif trouvé.');
    process.exit(1);
  }
  const data = all;
  console.log(`${data.length} produits chargés. Classification en cours…`);

  const rows: AuditRow[] = (data as ProductRow[]).map(p => ({
    product: p,
    result: classifyProduct(p),
  }));

  const outDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const stamp = new Date().toISOString().slice(0, 10);
  const ambiguPath = path.join(outDir, `audit-taxonomy-ambigus-${stamp}.csv`);
  const allPath = path.join(outDir, `audit-taxonomy-all-${stamp}.csv`);
  const summaryPath = path.join(outDir, `audit-taxonomy-summary-${stamp}.md`);

  fs.writeFileSync(ambiguPath, toCSV(rows, true), 'utf8');
  fs.writeFileSync(allPath, toCSV(rows, false), 'utf8');
  fs.writeFileSync(summaryPath, buildSummary(rows), 'utf8');

  const ambiguCount = rows.filter(r => r.result.ambiguites.length > 0).length;

  console.log(`\n✅ Audit terminé.`);
  console.log(`   Ambigus : ${ambiguCount} / ${rows.length}`);
  console.log(`   Fichiers :`);
  console.log(`   - ${ambiguPath}`);
  console.log(`   - ${allPath}`);
  console.log(`   - ${summaryPath}`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
