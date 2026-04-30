import { config } from 'dotenv';
config({ path: '.env.local' });
import { supabaseAdmin } from '../src/lib/supabase-admin';
import { scoreUniverses, VIGNOBLE_POSTES } from '../src/lib/universe-affinity';

(async () => {
  const all: any[] = [];
  let from = 0;
  while (true) {
    const { data } = await supabaseAdmin
      .from('products')
      .select('nom, univers, fournisseur, marque, normes, categorie, description, genre, grammage, certifications, composition, tags')
      .eq('actif', true)
      .order('id', { ascending: true })
      .range(from, from + 999);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  console.log('Total actifs:', all.length);

  // Re-score à la volée pour avoir les valeurs courantes (au cas où DB pas à jour)
  const scored = all.map(p => ({
    ...p,
    univers: scoreUniverses({
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
    }),
  }));

  const counts: Record<string, number> = {};
  for (const p of scored) {
    for (const u of Object.keys(p.univers || {})) counts[u] = (counts[u] || 0) + 1;
  }
  console.log('\nCounts par univers (re-scoré):', counts);

  console.log('\n📋 Top 5 par sous-poste vignoble :');
  for (const poste of VIGNOBLE_POSTES) {
    const matches = scored
      .filter(p => p.univers?.[poste])
      .sort((a, b) => (b.univers[poste] || 0) - (a.univers[poste] || 0))
      .slice(0, 5);
    console.log(`\n  ${poste} (${scored.filter(p => p.univers?.[poste]).length} produits) :`);
    for (const m of matches) {
      console.log(`    ${m.univers[poste].toFixed(2)} | ${m.fournisseur.padEnd(12)} | ${(m.nom || '').substring(0, 70)}`);
    }
  }
})();
