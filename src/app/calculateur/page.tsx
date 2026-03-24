import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { CalculateurClient } from '@/components/calculateur/CalculateurClient';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function CalculateurPage({
  searchParams,
}: {
  searchParams: { ref?: string };
}) {
  const ref = searchParams.ref;

  if (!ref) {
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

  // Récupérer le nom du produit côté serveur
  const { data: product } = await supabase
    .from('products')
    .select('nom, ref_fournisseur')
    .eq('ref_fournisseur', ref)
    .single();

  if (!product) {
    return (
      <main className="min-h-screen bg-white">
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold text-neutral-900 mb-4">Produit introuvable</h1>
          <p className="text-sm text-neutral-500 mb-8">
            La référence {ref} n&apos;existe pas dans notre catalogue.
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
          <Link href={`/catalogue/${ref}`} className="hover:text-neutral-700 transition-colors">
            {product.nom}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-600">Devis</span>
        </nav>

        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight mb-8">
          Calculateur de devis
        </h1>

        <CalculateurClient initialRef={ref} productName={product.nom} />
      </div>
    </main>
  );
}
