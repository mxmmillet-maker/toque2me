import { createClient } from '@supabase/supabase-js';
import { CatalogueClient } from '@/components/catalogue/CatalogueClient';
import { getMargin } from '@/lib/pricing';
import Link from 'next/link';

export const revalidate = 3600;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getProducts() {
  // Supabase limite à 1000 par défaut — on pagine côté serveur
  const allProducts: any[] = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('actif', true)
      .or('exclu.is.null,exclu.eq.false')
      .order('nom')
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('Supabase error:', error.message);
      break;
    }

    if (!data || data.length === 0) break;
    allProducts.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  // Récupérer le prix du palier le plus bas (qte_min ASC) par produit
  // Équivalent de : SELECT DISTINCT ON (product_id) product_id, prix_ht FROM prices ORDER BY product_id, qte_min ASC
  const allPrices: { product_id: string; prix_ht: number }[] = [];
  let priceFrom = 0;
  while (true) {
    const { data: priceBatch } = await supabase
      .from('prices')
      .select('product_id, qte_min, prix_ht')
      .order('product_id')
      .order('qte_min', { ascending: true })
      .range(priceFrom, priceFrom + 999);

    if (!priceBatch || priceBatch.length === 0) break;
    allPrices.push(...priceBatch);
    if (priceBatch.length < 1000) break;
    priceFrom += 1000;
  }

  if (allPrices.length > 0) {
    // Coefficient de marge (par défaut pour le catalogue)
    const defaultMargin = await getMargin('cybernecard');

    // DISTINCT ON (product_id) : garder le premier par product_id (qte_min le plus bas)
    const minPrices = new Map<string, number>();
    for (const p of allPrices) {
      if (!minPrices.has(p.product_id)) {
        minPrices.set(p.product_id, p.prix_ht);
      }
    }
    for (const product of allProducts) {
      const prixAchat = minPrices.get(product.id);
      if (prixAchat !== undefined) {
        // Prix de VENTE = prix achat × coefficient (arrondi au centime supérieur)
        product.prix_from = Math.ceil(prixAchat * defaultMargin.coefficient * 100) / 100;
      }
    }
  }

  return allProducts;
}

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: { categorie?: string; from?: string; line?: string };
}) {
  const products = await getProducts();

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-16">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-xs text-slate-400">
          <Link href="/" className="hover:text-neutral-900 transition-colors">Accueil</Link>
          <span>/</span>
          <span className="text-slate-600">Catalogue</span>
        </nav>

        <div className="mb-10">
          <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
            Catalogue
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {products.length} produits — Textile et objets personnalisables pour professionnels
          </p>
        </div>

        <CatalogueClient
          products={products}
          initialCategorie={searchParams.categorie}
          packMode={searchParams.from === 'pack' ? searchParams.line : undefined}
        />
      </div>
    </main>
  );
}
