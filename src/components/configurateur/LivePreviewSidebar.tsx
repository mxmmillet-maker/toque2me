'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/lib/cart';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Product {
  nom: string;
  ref_fournisseur: string;
  categorie: string;
  image_url: string;
  prix_vente_ht?: number;
  couleurs?: { nom: string; hexa: string; image?: string }[];
}

interface Props {
  products: Product[];
  loading: boolean;
  nbPersonnes?: number;
  title?: string;
  subtitle?: string;
}

export function LivePreviewSidebar({ products, loading, nbPersonnes, title = 'Votre sélection', subtitle }: Props) {
  const { add } = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);

  const handleAddAll = () => {
    for (const p of products) {
      add({
        ref: p.ref_fournisseur,
        nom: p.nom,
        image_url: p.image_url,
        qty: nbPersonnes || 10,
        prix_from: p.prix_vente_ht,
        categorie: p.categorie,
        couleurs_dispo: p.couleurs,
      });
    }
    setAdded(true);
    setTimeout(() => router.push('/panier'), 600);
  };

  const totalEstime = products.reduce((sum, p) => sum + (p.prix_vente_ht || 0) * (nbPersonnes || 10), 0);

  return (
    <aside className="bg-neutral-50 rounded-2xl p-5 border border-neutral-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
          {subtitle && <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>}
        </div>
        {products.length > 0 && (
          <span className="px-2 py-1 text-xs font-medium bg-neutral-900 text-white rounded-full">
            {products.length}
          </span>
        )}
      </div>

      {/* Skeletons pendant chargement */}
      {loading && products.length === 0 && (
        <div className="space-y-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex gap-3 p-3 bg-white rounded-xl animate-pulse">
              <div className="w-12 h-12 bg-neutral-200 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-neutral-200 rounded w-3/4" />
                <div className="h-3 bg-neutral-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && products.length === 0 && (
        <div className="py-8 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-neutral-100 flex items-center justify-center">
            <svg className="h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
          </div>
          <p className="text-xs text-neutral-400">Répondez aux questions et vos produits apparaîtront ici.</p>
        </div>
      )}

      {/* Liste produits */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {products.map((p, i) => (
            <motion.div
              key={p.ref_fournisseur}
              layout
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 300, damping: 25 }}
              className="flex gap-3 p-3 bg-white rounded-xl border border-neutral-100"
            >
              <div className="relative w-12 h-12 bg-neutral-50 rounded-lg overflow-hidden flex-shrink-0">
                {p.image_url && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={p.image_url} alt={p.nom} className="absolute inset-0 w-full h-full object-contain p-1" loading="lazy" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-neutral-900 line-clamp-1">{p.nom}</p>
                <p className="text-[10px] text-neutral-400">{p.categorie}</p>
                {p.prix_vente_ht && (
                  <p className="text-xs font-semibold text-neutral-900 mt-0.5 tabular-nums">
                    {p.prix_vente_ht.toFixed(2)} € <span className="text-[10px] font-normal text-neutral-400">/ pce</span>
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* CTA */}
      {products.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 pt-4 border-t border-neutral-200 space-y-2"
        >
          {nbPersonnes && totalEstime > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Estimation ({nbPersonnes} pers.)</span>
              <span className="font-semibold text-neutral-900 tabular-nums">{totalEstime.toFixed(0)} € HT</span>
            </div>
          )}
          <button
            onClick={handleAddAll}
            disabled={added}
            className={`w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              added ? 'bg-emerald-600 text-white' : 'bg-neutral-900 text-white hover:bg-neutral-800'
            }`}
          >
            {added ? '✓ Ajouté au panier' : 'Ajouter au panier'}
          </button>
        </motion.div>
      )}
    </aside>
  );
}
