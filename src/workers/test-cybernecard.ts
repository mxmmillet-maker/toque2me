import { CyberneCardAdapter } from './adapters/cybernecard';
import { syncSupplier } from './lib/sync-engine';

async function main() {
  console.log('=== SYNC COMPLET CYBERNECARD → SUPABASE ===\n');

  const result = await syncSupplier(CyberneCardAdapter);

  console.log('\n=== RÉSULTAT ===');
  console.log(`  Statut        : ${result.statut.toUpperCase()}`);
  console.log(`  Produits traités : ${result.nb_traites}`);
  console.log(`  Produits insérés : ${result.nb_nouveaux}`);
  console.log(`  Erreurs          : ${result.nb_erreurs}`);
  console.log(`  Durée            : ${(result.duree_ms / 1000).toFixed(1)}s`);
  if (result.details) console.log(`  Détails        : ${result.details}`);
}

main().catch(console.error);
