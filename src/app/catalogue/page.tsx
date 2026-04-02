import { supabaseAdmin } from '@/lib/supabase-admin';
import { CatalogueClient } from '@/components/catalogue/CatalogueClient';
import { getMargin } from '@/lib/pricing';
import Link from 'next/link';

export const revalidate = 300; // 5 min — les produits ne changent pas souvent

async function getProducts() {
  // Charger produits ET prix EN PARALLÈLE (pas séquentiellement)
  const [productsResult, pricesResult, defaultMargin] = await Promise.all([
    // Produits (paginé)
    (async () => {
      const all: any[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabaseAdmin
          .from('products')
          .select('id, nom, ref_fournisseur, categorie, image_url, fournisseur, grammage, origine, certifications, style, couleurs, score_durabilite, score_premium')
          .eq('actif', true)
          .or('exclu.is.null,exclu.eq.false')
          .order('nom')
          .range(from, from + pageSize - 1);
        if (error || !data || data.length === 0) break;
        all.push(...data);
        if (data.length < pageSize) break;
        from += pageSize;
      }
      return all;
    })(),
    // Prix (paginé)
    (async () => {
      const all: { product_id: string; prix_ht: number }[] = [];
      let from = 0;
      while (true) {
        const { data } = await supabaseAdmin
          .from('prices')
          .select('product_id, qte_min, prix_ht')
          .order('product_id')
          .order('qte_min', { ascending: true })
          .range(from, from + 999);
        if (!data || data.length === 0) break;
        all.push(...data);
        if (data.length < 1000) break;
        from += 1000;
      }
      return all;
    })(),
    // Marge
    getMargin('cybernecard'),
  ]);

  // Appliquer les prix de vente
  if (pricesResult.length > 0) {
    const minPrices = new Map<string, number>();
    for (const p of pricesResult) {
      if (!minPrices.has(p.product_id)) {
        minPrices.set(p.product_id, p.prix_ht);
      }
    }
    for (const product of productsResult) {
      const prixAchat = minPrices.get(product.id);
      if (prixAchat !== undefined) {
        product.prix_from = Math.ceil(prixAchat * defaultMargin.coefficient * 100) / 100;
      }
    }
  }

  return productsResult;
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
