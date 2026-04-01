import { supabaseAdmin } from '@/lib/supabase-admin';
import Link from 'next/link';
import { CalculateurClient } from '@/components/calculateur/CalculateurClient';
import { CalculateurMultiClient } from '@/components/calculateur/CalculateurMultiClient';

export default async function CalculateurPage({
  searchParams,
}: {
  searchParams: { ref?: string; refs?: string };
}) {
  const singleRef = searchParams.ref;
  const multiRefs = searchParams.refs;

  // Multi-produit (depuis le configurateur)
  if (multiRefs) {
    // Parse refs: "REF1,REF2~REF2B,REF3" → REF2~REF2B = paire H/F
    const rawRefs = multiRefs.split(',').filter(Boolean);
    const allRefs = rawRefs.flatMap(r => r.split('~'));
    const paires = rawRefs.filter(r => r.includes('~')).map(r => {
      const [a, b] = r.split('~');
      return { refA: a, refB: b };
    });

    const { data: products } = await supabaseAdmin
      .from('products')
      .select('nom, ref_fournisseur, image_url, categorie')
      .in('ref_fournisseur', allRefs);

    if (!products || products.length === 0) {
      return (
        <main className="min-h-screen bg-white">
          <div className="max-w-lg mx-auto px-4 py-16 text-center">
            <h1 className="text-2xl font-semibold text-neutral-900 mb-4">Produits introuvables</h1>
            <p className="text-sm text-neutral-500 mb-8">
              Les références demandées n&apos;existent pas dans notre catalogue.
            </p>
            <Link
              href="/catalogue"
              className="inline-flex items-center px-6 py-3 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
            >
              Retour au catalogue
            </Link>
          </div>
        </main>
      );
    }

    return (
      <main className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <nav className="mb-8 text-sm text-neutral-400">
            <Link href="/configurateur" className="hover:text-neutral-700 transition-colors">
              Configurateur
            </Link>
            <span className="mx-2">/</span>
            <span className="text-neutral-600">Devis</span>
          </nav>

          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight mb-2">
            Votre devis multi-produits
          </h1>
          <p className="text-sm text-neutral-500 mb-8">
            Définissez la quantité pour chaque produit sélectionné
          </p>

          <CalculateurMultiClient products={products} paires={paires} />
        </div>
      </main>
    );
  }

  // Mono-produit (depuis le catalogue)
  if (!singleRef) {
    return (
      <main className="min-h-screen bg-white">
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold text-neutral-900 mb-4">Calculateur de devis</h1>
          <p className="text-sm text-neutral-500 mb-8">
            Sélectionnez un produit depuis le catalogue pour démarrer votre devis.
          </p>
          <Link
            href="/catalogue"
            className="inline-flex items-center px-6 py-3 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
          >
            Parcourir le catalogue
          </Link>
        </div>
      </main>
    );
  }

  const { data: product } = await supabaseAdmin
    .from('products')
    .select('nom, ref_fournisseur')
    .eq('ref_fournisseur', singleRef)
    .single();

  if (!product) {
    return (
      <main className="min-h-screen bg-white">
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold text-neutral-900 mb-4">Produit introuvable</h1>
          <p className="text-sm text-neutral-500 mb-8">
            La référence {singleRef} n&apos;existe pas dans notre catalogue.
          </p>
          <Link
            href="/catalogue"
            className="inline-flex items-center px-6 py-3 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
          >
            Retour au catalogue
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
        <nav className="mb-8 text-sm text-neutral-400">
          <Link href="/catalogue" className="hover:text-neutral-700 transition-colors">
            Catalogue
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/catalogue/${singleRef}`} className="hover:text-neutral-700 transition-colors">
            {product.nom}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-600">Devis</span>
        </nav>

        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight mb-8">
          Calculateur de devis
        </h1>

        <CalculateurClient initialRef={singleRef} productName={product.nom} />
      </div>
    </main>
  );
}
