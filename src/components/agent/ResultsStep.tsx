'use client';

import Image from 'next/image';
import Link from 'next/link';

interface Product {
  nom: string;
  ref_fournisseur: string;
  categorie: string;
  image_url: string;
  prix_vente_ht?: number;
  score_durabilite: number;
  origine: string;
  certifications: string[];
}

interface ResultsStepProps {
  products: Product[];
  onRefine: () => void;
}

export function ResultsStep({ products, onRefine }: ResultsStepProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-neutral-500 text-sm mb-4">Aucun produit ne correspond à ces critères.</p>
        <button onClick={onRefine} className="text-sm text-neutral-900 underline underline-offset-2">
          Modifier mes critères
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-neutral-900 mb-2">
        Voici notre sélection pour vous
      </h2>
      <p className="text-sm text-neutral-500 mb-6">
        {products.length} produit{products.length > 1 ? 's' : ''} correspondent à vos critères
      </p>

      <div className="space-y-3 mb-6">
        {products.map((p) => (
          <Link
            key={p.ref_fournisseur}
            href={`/catalogue/${p.ref_fournisseur}`}
            className="flex gap-4 p-4 border border-neutral-100 rounded-xl hover:border-neutral-300 hover:shadow-sm transition-all"
          >
            <div className="relative w-20 h-20 bg-neutral-50 rounded-lg overflow-hidden flex-shrink-0">
              {p.image_url ? (
                <Image src={p.image_url} alt={p.nom} fill className="object-cover" sizes="80px" />
              ) : (
                <div className="flex items-center justify-center h-full text-neutral-300 text-xs">N/A</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-neutral-900 line-clamp-1">{p.nom}</h3>
              <p className="text-xs text-neutral-400 mt-0.5">{p.categorie} — {p.origine || 'N/A'}</p>
              {p.certifications.length > 0 && (
                <div className="flex gap-1 mt-1.5">
                  {p.certifications.map((c) => (
                    <span key={c} className="px-1.5 py-0.5 text-[10px] bg-neutral-100 text-neutral-600 rounded">
                      {c}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-1.5">
                {p.prix_vente_ht ? (
                  <span className="text-sm font-semibold text-neutral-900">
                    {p.prix_vente_ht.toFixed(2)} € <span className="text-xs font-normal text-neutral-400">HT/pce</span>
                  </span>
                ) : (
                  <span className="text-xs text-neutral-400">Prix sur devis</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onRefine}
          className="flex-1 py-2.5 border border-neutral-200 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-50 transition-colors"
        >
          Affiner avec l&apos;assistant
        </button>
        <Link
          href={`/calculateur?ref=${products[0].ref_fournisseur}`}
          className="flex-1 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-lg text-center hover:bg-neutral-800 transition-colors"
        >
          Demander un devis
        </Link>
      </div>
    </div>
  );
}
