'use client';

import { useCart } from '@/lib/cart';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function PanierPage() {
  const { items, count, remove, updateQty, clear } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalEstime = items.reduce((sum, i) => sum + (i.prix_from || 0) * i.qty, 0);

  const genererDevis = async () => {
    if (items.length === 0) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/devis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lignes: items.map(i => ({
            ref: i.ref,
            qty: i.qty,
            couleur: i.couleur || undefined,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Erreur ${res.status}`);
      }

      const data = await res.json();
      clear();
      router.push(`/devis/${data.share_token}`);
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la génération du devis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <nav className="mb-6 flex items-center gap-1.5 text-xs text-slate-400">
          <Link href="/" className="hover:text-neutral-900 transition-colors">Accueil</Link>
          <span>/</span>
          <span className="text-slate-600">Panier</span>
        </nav>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900">
            Mon panier
            {count > 0 && (
              <span className="ml-2 text-base font-normal text-neutral-400">
                ({count} article{count > 1 ? 's' : ''})
              </span>
            )}
          </h1>
          {items.length > 0 && (
            <button
              onClick={clear}
              className="text-xs text-neutral-400 hover:text-red-500 underline underline-offset-2 transition-colors"
            >
              Vider le panier
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="py-20 text-center border border-neutral-100 rounded-xl">
            <svg className="mx-auto h-12 w-12 text-neutral-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <p className="text-neutral-400 text-sm mb-4">Votre panier est vide</p>
            <Link
              href="/catalogue"
              className="inline-flex px-5 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
            >
              Parcourir le catalogue
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Liste articles */}
            <div className="lg:col-span-2 space-y-3">
              {items.map((item) => (
                <div
                  key={`${item.ref}-${item.couleur || ''}`}
                  className="flex gap-4 p-4 border border-neutral-100 rounded-xl hover:border-neutral-200 transition-colors"
                >
                  {/* Image */}
                  <Link href={`/catalogue/${item.ref}`} className="flex-shrink-0">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.nom}
                        width={80}
                        height={80}
                        className="w-20 h-20 object-contain rounded-lg bg-neutral-50"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-neutral-50 rounded-lg flex items-center justify-center text-neutral-300 text-xs">
                        Photo
                      </div>
                    )}
                  </Link>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/catalogue/${item.ref}`} className="text-sm font-medium text-neutral-900 hover:underline line-clamp-1">
                      {item.nom}
                    </Link>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Réf. {item.ref}
                      {item.couleur && (
                        <span className="inline-flex items-center gap-1 ml-2">
                          {item.couleur_hexa && (
                            <span className="w-3 h-3 rounded-full inline-block border border-neutral-200" style={{ backgroundColor: item.couleur_hexa }} />
                          )}
                          {item.couleur}
                        </span>
                      )}
                    </p>

                    {/* Quantité */}
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => updateQty(item.ref, item.couleur, item.qty - 1)}
                        className="w-7 h-7 flex items-center justify-center border border-neutral-200 rounded-md text-neutral-500 hover:bg-neutral-50 text-sm"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={item.qty}
                        onChange={(e) => updateQty(item.ref, item.couleur, parseInt(e.target.value) || 1)}
                        min={1}
                        className="w-14 text-center text-sm border border-neutral-200 rounded-md py-1 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      />
                      <button
                        onClick={() => updateQty(item.ref, item.couleur, item.qty + 1)}
                        className="w-7 h-7 flex items-center justify-center border border-neutral-200 rounded-md text-neutral-500 hover:bg-neutral-50 text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Prix + supprimer */}
                  <div className="flex flex-col items-end justify-between">
                    {item.prix_from ? (
                      <p className="text-sm font-semibold text-neutral-900 tabular-nums">
                        {(item.prix_from * item.qty).toFixed(2)} €
                        <span className="text-xs text-neutral-400 font-normal block text-right">
                          {item.prix_from.toFixed(2)} € / pce
                        </span>
                      </p>
                    ) : (
                      <p className="text-xs text-neutral-400">Sur devis</p>
                    )}
                    <button
                      onClick={() => remove(item.ref, item.couleur)}
                      className="text-xs text-neutral-400 hover:text-red-500 transition-colors"
                      title="Retirer"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Résumé */}
            <div className="lg:col-span-1">
              <div className="sticky top-20 bg-neutral-50 rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">Résumé</h2>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">{count} article{count > 1 ? 's' : ''}</span>
                    <span className="text-neutral-900 font-medium tabular-nums">
                      {totalEstime > 0 ? `${totalEstime.toFixed(2)} € HT` : 'Sur devis'}
                    </span>
                  </div>
                  {totalEstime > 0 && (
                    <div className="flex justify-between pt-2 border-t border-neutral-200">
                      <span className="text-neutral-900 font-medium">Estimation TTC</span>
                      <span className="text-neutral-900 font-semibold tabular-nums">
                        {(totalEstime * 1.2).toFixed(2)} €
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-neutral-400">
                  Prix indicatifs basés sur le tarif unitaire minimum. Le devis final tiendra compte des quantités et du marquage.
                </p>

                {error && (
                  <p className="text-xs text-red-500 bg-red-50 p-2 rounded-lg">{error}</p>
                )}

                <button
                  onClick={genererDevis}
                  disabled={loading || items.length === 0}
                  className="w-full px-5 py-3 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 active:bg-neutral-950 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Génération...' : 'Demander un devis'}
                </button>

                <Link
                  href="/catalogue"
                  className="block text-center text-xs text-neutral-500 hover:text-neutral-900 underline underline-offset-2 transition-colors"
                >
                  Continuer mes achats
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
