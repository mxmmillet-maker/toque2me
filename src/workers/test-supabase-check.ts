import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Count
  const { count } = await sb.from('products').select('*', { count: 'exact', head: true });
  console.log(`Total produits en base : ${count}\n`);

  // 3 premiers
  const { data, error } = await sb.from('products').select('*').limit(3);
  if (error) { console.error('Erreur:', error.message); return; }

  data?.forEach((p, i) => {
    console.log(`── Produit ${i + 1} ──`);
    console.log(`  Ref         : ${p.ref_fournisseur}`);
    console.log(`  Nom         : ${p.nom}`);
    console.log(`  Fournisseur : ${p.fournisseur}`);
    console.log(`  Catégorie   : ${p.categorie}`);
    console.log(`  Grammage    : ${p.grammage || '—'}`);
    console.log(`  Image       : ${p.image_url || '—'}`);
    console.log(`  Actif       : ${p.actif}`);
    console.log('');
  });
}

main().catch(console.error);
