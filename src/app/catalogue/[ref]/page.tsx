import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { NormeBadge } from '@/components/catalogue/NormeBadge';
import { PriceGrid } from '@/components/catalogue/PriceGrid';
import { ColorSelector } from '@/components/catalogue/ColorSelector';
import { getPriceTiers } from '@/lib/pricing';
import type { Metadata } from 'next';

export const revalidate = 3600;

async function getProduct(ref: string) {
  const { data } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('ref_fournisseur', ref)
    .limit(1)
    .single();
  return data;
}

export async function generateMetadata({ params }: { params: { ref: string } }): Promise<Metadata> {
  const { data: p } = await supabaseAdmin
    .from('products')
    .select('nom, description, image_url, categorie')
    .eq('ref_fournisseur', params.ref)
    .single();

  if (!p) return { title: 'Produit introuvable — Toque2Me' };

  const desc = (p.description || '').substring(0, 155).replace(/\n/g, ' ');

  return {
    title: `${p.nom} — Toque2Me`,
    description: desc || `${p.nom} personnalisable avec votre logo. Devis en 3 minutes.`,
    openGraph: {
      title: `${p.nom} — Toque2Me`,
      description: desc,
      images: p.image_url ? [{ url: p.image_url, width: 600, height: 600 }] : [],
    },
  };
}

export default async function ProductPage({ params, searchParams }: { params: { ref: string }; searchParams: { from?: string; line?: string } }) {
  const fromPack = searchParams.from === 'pack';
  const packLineId = searchParams.line;
  const product = await getProduct(params.ref);
  if (!product) return notFound();

  const tiers = await getPriceTiers(product.id, product.fournisseur, product.categorie);
  const prixFrom = tiers.length > 0 ? tiers[0].prix_vente_ht : null;

  // JSON-LD Product schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.nom,
    description: (product.description || '').substring(0, 500),
    image: product.image_url || undefined,
    sku: product.ref_fournisseur,
    offers: prixFrom ? {
      '@type': 'Offer',
      price: prixFrom,
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
    } : undefined,
  };

  const hasNormes = product.normes && product.normes.length > 0;
  const hasCertifications = product.certifications && product.certifications.length > 0;

  // Extraire la composition depuis la description
  const compositionMatch = (product.description || '').match(/(\d+\s*%\s*\w+[\s,]*)+/);
  const composition = compositionMatch ? compositionMatch[0].trim() : null;

  return (
    <main className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-neutral-400">
          <Link href="/catalogue" className="hover:text-neutral-700 transition-colors">
            Catalogue
          </Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-600">{product.nom}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Photo + Couleurs */}
          <div>
            <ColorSelector
              colors={product.couleurs || []}
              defaultImage={product.image_url || ''}
              productName={product.nom}
            />
            {product.score_durabilite && product.score_durabilite >= 85 && (
              <div className="mt-2 inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium tracking-wider uppercase rounded-lg border border-emerald-200">
                Éco-responsable
              </div>
            )}
          </div>

          {/* Infos */}
          <div className="flex flex-col">
            {/* En-tête — PAS de nom fournisseur */}
            <div className="mb-6">
              <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">
                Réf. {product.ref_fournisseur}
              </p>
              <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
                {product.nom}
              </h1>
            </div>

            {/* Prix de VENTE */}
            <div className="mb-6 pb-6 border-b border-neutral-100">
              {prixFrom ? (
                <>
                  <span className="text-sm text-neutral-400">À partir de </span>
                  <span className="text-2xl font-semibold text-neutral-900">
                    {prixFrom.toFixed(2)}&nbsp;€
                  </span>
                  <span className="text-sm text-neutral-400"> HT / pièce</span>
                </>
              ) : (
                <span className="text-sm text-neutral-400">Prix sur devis</span>
              )}
            </div>

            {/* Description */}
            <div className="mb-6">
              <p className="text-sm leading-relaxed text-neutral-600 whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {/* Caractéristiques */}
            <div className="mb-6 pb-6 border-b border-neutral-100">
              <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">
                Caractéristiques
              </h2>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-3">
                {product.grammage && (
                  <>
                    <dt className="text-sm text-neutral-500">Grammage</dt>
                    <dd className="text-sm font-medium text-neutral-900">{product.grammage} g/m²</dd>
                  </>
                )}
                {composition && (
                  <>
                    <dt className="text-sm text-neutral-500">Composition</dt>
                    <dd className="text-sm font-medium text-neutral-900">{composition}</dd>
                  </>
                )}
                {product.origine && (
                  <>
                    <dt className="text-sm text-neutral-500">Origine</dt>
                    <dd className="text-sm font-medium text-neutral-900">{product.origine}</dd>
                  </>
                )}
                {product.categorie && (
                  <>
                    <dt className="text-sm text-neutral-500">Catégorie</dt>
                    <dd className="text-sm font-medium text-neutral-900">{product.categorie}</dd>
                  </>
                )}
              </dl>
            </div>

            {/* Normes & Certifications */}
            {(hasNormes || hasCertifications) && (
              <div className="mb-6 pb-6 border-b border-neutral-100">
                <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">
                  Normes & Certifications
                </h2>
                <div className="flex flex-wrap gap-2">
                  {product.normes?.map((n: string) => (
                    <NormeBadge key={n} label={n} variant="norme" />
                  ))}
                  {product.certifications?.map((c: string) => (
                    <NormeBadge key={c} label={c} variant="certification" />
                  ))}
                </div>
              </div>
            )}

            {/* Grille tarifaire de VENTE */}
            {tiers.length > 0 && (
              <div className="mb-8">
                <PriceGrid tiers={tiers} />
              </div>
            )}

            {/* CTA */}
            <div className="mt-auto pt-4 space-y-3">
              {fromPack && packLineId ? (
                <Link
                  href={packLineId === 'add'
                    ? `/restaurateurs?add=${product.ref_fournisseur}`
                    : `/restaurateurs?replace=${packLineId}&ref=${product.ref_fournisseur}`
                  }
                  className="inline-flex items-center justify-center w-full px-8 py-3 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 active:bg-neutral-950 transition-colors"
                >
                  {packLineId === 'add' ? 'Ajouter au pack' : 'Sélectionner pour le pack'}
                  <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </Link>
              ) : (
                <Link
                  href={`/calculateur?ref=${product.ref_fournisseur}`}
                  className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-3 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 active:bg-neutral-950 transition-colors"
                >
                  Configurer mon devis
                  <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              )}
              <p className="text-xs text-neutral-400 text-center sm:text-left">
                {fromPack ? 'Ce produit remplacera la ligne actuelle du pack' : 'Devis gratuit — réponse sous 24h'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
