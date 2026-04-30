import { config } from 'dotenv';
config({ path: '.env.local' });

import { supabaseAdmin } from '../src/lib/supabase-admin';
import { scoreUniverses } from '../src/lib/universe-affinity';

interface Row {
  id: string;
  nom: string | null;
  description: string | null;
  categorie: string | null;
  marque: string | null;
  genre: string | null;
  grammage: number | null;
  normes: string[] | null;
  certifications: string[] | null;
  composition: string | null;
  tags: Record<string, any> | null;
  univers: Record<string, number> | null;
}

function shallowEq(a: Record<string, number>, b: Record<string, number>): boolean {
  const ak = Object.keys(a).sort();
  const bk = Object.keys(b).sort();
  if (ak.length !== bk.length) return false;
  for (let i = 0; i < ak.length; i++) {
    if (ak[i] !== bk[i]) return false;
    if (a[ak[i]] !== b[bk[i]]) return false;
  }
  return true;
}

async function main() {
  const dryRun = process.argv.includes('--dry');
  console.log(`Backfill univers — mode ${dryRun ? 'DRY RUN' : 'WRITE'}`);
  console.log('Chargement des produits actifs (paginé)…');

  const all: Row[] = [];
  const pageSize = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('id, nom, description, categorie, marque, genre, grammage, normes, certifications, composition, tags, univers')
      .eq('actif', true)
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) {
      console.error('Erreur Supabase:', error.message);
      process.exit(1);
    }
    if (!data || data.length === 0) break;
    all.push(...(data as Row[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }
  console.log(`${all.length} produits chargés.`);

  let changed = 0;
  let unchanged = 0;
  let vignobleNew = 0;
  const updates: { id: string; univers: Record<string, number> }[] = [];

  for (const p of all) {
    const newScores = scoreUniverses({
      nom: p.nom || '',
      description: p.description || '',
      categorie: p.categorie || '',
      marque: p.marque || '',
      genre: p.genre || undefined,
      normes: p.normes || [],
      certifications: p.certifications || [],
      grammage: p.grammage || undefined,
      meta: { composition: p.composition },
      tags: p.tags || undefined,
    });

    const old = p.univers || {};
    if (shallowEq(old as any, newScores as any)) {
      unchanged++;
      continue;
    }
    if (!old.vignoble && (newScores as any).vignoble) vignobleNew++;
    changed++;
    updates.push({ id: p.id, univers: newScores as any });
  }

  console.log(`\n📊 Résultats du scoring`);
  console.log(`  Inchangés     : ${unchanged}`);
  console.log(`  Modifiés      : ${changed}`);
  console.log(`  Nouveau Vignoble : ${vignobleNew}`);

  // Compter les produits qui auront vignoble > 0 au total
  const totalVignoble = updates.filter(u => u.univers.vignoble).length
    + all.filter(p => p.univers?.vignoble && !updates.find(u => u.id === p.id)).length;
  console.log(`  Total avec score Vignoble : ${totalVignoble}`);

  if (dryRun) {
    console.log('\n✋ DRY RUN — aucune écriture en DB. Re-lance sans --dry pour appliquer.');
    return;
  }

  if (changed === 0) {
    console.log('\n✅ Rien à faire.');
    return;
  }

  console.log(`\n💾 Écriture de ${changed} updates par batch de 500…`);
  let written = 0;
  const batchSize = 500;
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    // Update individuel par id (Supabase ne supporte pas bulk update différents par row)
    // On parallélise par batch
    await Promise.all(batch.map(u =>
      supabaseAdmin.from('products').update({ univers: u.univers }).eq('id', u.id)
    ));
    written += batch.length;
    process.stdout.write(`  ${written}/${updates.length}\r`);
  }
  console.log(`\n✅ ${written} produits mis à jour.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
