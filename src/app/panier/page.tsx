'use client';

import { useCart } from '@/lib/cart';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function PanierPage() {
  const { items, groupes, count, remove, updateQty, moveToGroupe, addGroupe, removeGroupe, renameGroupe, clear } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newGroupe, setNewGroupe] = useState('');
  const [editingGroupe, setEditingGroupe] = useState<string | null>(null);
  const [editGroupeName, setEditGroupeName] = useState('');

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

  const handleAddGroupe = () => {
    if (!newGroupe.trim()) return;
    addGroupe(newGroupe.trim());
    setNewGroupe('');
  };

  const handleRename = (oldName: string) => {
    if (editGroupeName.trim()) renameGroupe(oldName, editGroupeName.trim());
    setEditingGroupe(null);
  };

  // Grouper les items
  const itemsByGroupe = groupes.map(g => ({
    name: g,
    items: items.filter(i => i.groupe === g),
  })).filter(g => g.items.length > 0 || groupes.length > 1);

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
            {/* Liste articles par groupe */}
            <div className="lg:col-span-2 space-y-6">
              {/* Ajouter un groupe */}
              <div className="flex items-center gap-2">
                <input
                  value={newGroupe}
                  onChange={(e) => setNewGroupe(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddGroupe()}
                  placeholder="Nouveau groupe (ex: Service Cuisine)..."
                  className="flex-1 px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
                <button
                  onClick={handleAddGroupe}
                  disabled={!newGroupe.trim()}
                  className="px-3 py-2 text-sm bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-30 transition-colors"
                >
                  + Groupe
                </button>
              </div>

              {itemsByGroupe.map(({ name, items: groupItems }) => (
                <div key={name} className="border border-neutral-100 rounded-xl overflow-hidden">
                  {/* Groupe header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 border-b border-neutral-100">
                    {editingGroupe === name ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={editGroupeName}
                          onChange={(e) => setEditGroupeName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRename(name)}
                          className="px-2 py-1 text-sm border border-neutral-200 rounded focus:outline-none focus:ring-2 focus:ring-neutral-900"
                          autoFocus
                        />
                        <button onClick={() => handleRename(name)} className="text-xs text-neutral-900 font-medium">OK</button>
                        <button onClick={() => setEditingGroupe(null)} className="text-xs text-neutral-400">Annuler</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-neutral-900">{name}</h3>
                        <span className="text-xs text-neutral-400">({groupItems.length})</span>
                        <button
                          onClick={() => { setEditingGroupe(name); setEditGroupeName(name); }}
                          className="text-xs text-neutral-400 hover:text-neutral-900 ml-1"
                          title="Renommer"
                        >
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                          </svg>
                        </button>
                      </div>
                    )}
                    {name !== 'Mon panier' && (
                      <button
                        onClick={() => removeGroupe(name)}
                        className="text-xs text-neutral-400 hover:text-red-500 transition-colors"
                      >
                        Supprimer le groupe
                      </button>
                    )}
                  </div>

                  {/* Items */}
                  {groupItems.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-neutral-400">
                      Glissez des produits ici ou changez le groupe depuis un article
                    </div>
                  ) : (
                    <div className="divide-y divide-neutral-50">
                      {groupItems.map((item) => (
                        <div key={`${item.ref}-${item.couleur || ''}`} className="flex gap-4 p-4">
                          {/* Image */}
                          <Link href={`/catalogue/${item.ref}`} className="flex-shrink-0">
                            {item.image_url ? (
                              <Image
                                src={item.image_url}
                                alt={item.nom}
                                width={64}
                                height={64}
                                className="w-16 h-16 object-contain rounded-lg bg-neutral-50"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-neutral-50 rounded-lg flex items-center justify-center text-neutral-300 text-xs">
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
                                    <span className="w-2.5 h-2.5 rounded-full inline-block border border-neutral-200" style={{ backgroundColor: item.couleur_hexa }} />
                                  )}
                                  {item.couleur}
                                </span>
                              )}
                            </p>

                            <div className="flex items-center gap-3 mt-2">
                              {/* Quantité */}
                              <div className="flex items-center">
                                <button
                                  onClick={() => updateQty(item.ref, item.couleur, item.qty - 1)}
                                  className="w-6 h-6 flex items-center justify-center border border-neutral-200 rounded-l-md text-neutral-500 hover:bg-neutral-50 text-xs"
                                >−</button>
                                <input
                                  type="number"
                                  value={item.qty}
                                  onChange={(e) => updateQty(item.ref, item.couleur, parseInt(e.target.value) || 1)}
                                  min={1}
                                  className="w-12 text-center text-xs border-y border-neutral-200 py-1 focus:outline-none"
                                />
                                <button
                                  onClick={() => updateQty(item.ref, item.couleur, item.qty + 1)}
                                  className="w-6 h-6 flex items-center justify-center border border-neutral-200 rounded-r-md text-neutral-500 hover:bg-neutral-50 text-xs"
                                >+</button>
                              </div>

                              {/* Déplacer vers groupe */}
                              {groupes.length > 1 && (
                                <select
                                  value={item.groupe}
                                  onChange={(e) => moveToGroupe(item.ref, item.couleur, e.target.value)}
                                  className="text-xs border border-neutral-200 rounded px-1.5 py-1 text-neutral-500 focus:outline-none"
                                >
                                  {groupes.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                              )}
                            </div>
                          </div>

                          {/* Prix + supprimer */}
                          <div className="flex flex-col items-end justify-between flex-shrink-0">
                            {item.prix_from ? (
                              <p className="text-sm font-semibold text-neutral-900 tabular-nums">
                                {(item.prix_from * item.qty).toFixed(2)} €
                                <span className="text-[10px] text-neutral-400 font-normal block text-right">
                                  {item.prix_from.toFixed(2)} €/pce
                                </span>
                              </p>
                            ) : (
                              <p className="text-xs text-neutral-400">Sur devis</p>
                            )}
                            <button
                              onClick={() => remove(item.ref, item.couleur)}
                              className="text-neutral-400 hover:text-red-500 transition-colors"
                              title="Retirer"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Résumé */}
            <div className="lg:col-span-1">
              <div className="sticky top-20 bg-neutral-50 rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">Résumé</h2>

                {/* Par groupe */}
                <div className="space-y-2 text-sm">
                  {itemsByGroupe.filter(g => g.items.length > 0).map(g => {
                    const sousTotal = g.items.reduce((s, i) => s + (i.prix_from || 0) * i.qty, 0);
                    return (
                      <div key={g.name} className="flex justify-between">
                        <span className="text-neutral-500 truncate mr-2">{g.name}</span>
                        <span className="text-neutral-700 tabular-nums flex-shrink-0">
                          {sousTotal > 0 ? `${sousTotal.toFixed(2)} €` : '—'}
                        </span>
                      </div>
                    );
                  })}
                  <div className="flex justify-between pt-2 border-t border-neutral-200">
                    <span className="text-neutral-500">{count} article{count > 1 ? 's' : ''}</span>
                    <span className="text-neutral-900 font-medium tabular-nums">
                      {totalEstime > 0 ? `${totalEstime.toFixed(2)} € HT` : 'Sur devis'}
                    </span>
                  </div>
                  {totalEstime > 0 && (
                    <div className="flex justify-between">
                      <span className="text-neutral-900 font-medium">Estimation TTC</span>
                      <span className="text-neutral-900 font-semibold tabular-nums">
                        {(totalEstime * 1.2).toFixed(2)} €
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-neutral-400">
                  Prix indicatifs. Le devis final tiendra compte des quantités et du marquage.
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
