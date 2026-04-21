import { supabaseAdmin } from '@/lib/supabase-admin';
import { CatalogueClient } from '@/components/catalogue/CatalogueClient';
import Link from 'next/link';

export const revalidate = 300; // 5 min

async function getProducts() {
  // Une seule query — prix_from est pré-calculé par le sync worker
  const all: any[] = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('id, nom, ref_fournisseur, fournisseur, categorie, image_url, grammage, origine, certifications, style, couleurs, score_durabilite, score_premium, prix_from, univers, est_nouveaute, genre, marque, tags, delai_prod_jours, description')
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
}

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: { categorie?: string; from?: string; line?: string };
}) {
  const products = await getProducts();

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-1.5 text-xs text-slate-400">
          <Link href="/" className="hover:text-neutral-900 transition-colors">Accueil</Link>
          <span>/</span>
          <span className="text-slate-600">Catalogue</span>
        </nav>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
            Catalogue
          </h1>
          <p className="mt-1 text-sm text-slate-500">
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
