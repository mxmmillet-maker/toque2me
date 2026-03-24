import { CyberneCardAdapter } from './adapters/cybernecard';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('=== SYNC PRIX CYBERNECARD ===\n');
  const start = Date.now();

  // 1. Charger le mapping ref → product_id
  console.log('Chargement du mapping ref → product_id...');
  const refToId = new Map<string, string>();
  let from = 0;
  while (true) {
    const { data } = await supabaseAdmin
      .from('products')
      .select('id, ref_fournisseur')
      .eq('fournisseur', 'cybernecard')
      .range(from, from + 999);
    if (!data || data.length === 0) break;
    for (const p of data) refToId.set(p.ref_fournisseur, p.id);
    if (data.length < 1000) break;
    from += 1000;
  }
  console.log(`  ${refToId.size} produits mappés\n`);

  // 2. Fetch les prix depuis l'API
  console.log('Récupération des prix Cybernecard...');
  const rawPrices = await CyberneCardAdapter.fetchPrices!();
  console.log(`  ${rawPrices.length} paliers récupérés\n`);

  // 3. Transformer avec les product_id
  const pricesToInsert = rawPrices
    .filter(p => refToId.has(p.product_ref))
    .map(p => ({
      fournisseur: 'cybernecard',
      product_id: refToId.get(p.product_ref)!,
      qte_min: p.qte_min,
      qte_max: p.qte_max,
      prix_ht: p.prix_ht,
    }));

  const skipped = rawPrices.length - pricesToInsert.length;
  console.log(`  ${pricesToInsert.length} paliers à insérer (${skipped} sans produit correspondant)\n`);

  // 4. Supprimer les anciens prix
  console.log('Suppression anciens prix cybernecard...');
  await supabaseAdmin.from('prices').delete().eq('fournisseur', 'cybernecard');

  // 5. Insérer par batch
  console.log('Insertion en base...');
  let inserted = 0;
  let errors = 0;
  const batchSize = 500;

  for (let i = 0; i < pricesToInsert.length; i += batchSize) {
    const batch = pricesToInsert.slice(i, i + batchSize);
    const { error } = await supabaseAdmin.from('prices').insert(batch);
    if (error) {
      console.error(`  Erreur batch ${i}:`, error.message);
      errors++;
    } else {
      inserted += batch.length;
    }
  }

  const duree = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n=== RÉSULTAT ===`);
  console.log(`  Paliers insérés : ${inserted}`);
  console.log(`  Erreurs batch   : ${errors}`);
  console.log(`  Durée           : ${duree}s`);
}

main().catch(console.error);
