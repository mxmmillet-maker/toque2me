'use client';

import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface Alternative {
  ref: string;
  nom: string;
  image_url: string;
  grammage: number | null;
  prix_vente_ht: number;
  score_premium: number;
  score_durabilite: number;
  tags: string[];
  genre: string;
}

interface AlternativesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentRef: string;
  currentNom: string;
  categorie: string;
  onSelect: (ref: string, nom: string, imageUrl: string) => void;
}

export function AlternativesDrawer({
  isOpen,
  onClose,
  currentRef,
  currentNom,
  categorie,
  onSelect,
}: AlternativesDrawerProps) {
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Current product price (from loaded alternatives context)
  const [currentPrix, setCurrentPrix] = useState<number | null>(null);

  // Slider states
  const [epaisseur, setEpaisseur] = useState<[number, number]>([0, 100]);
  const [gamme, setGamme] = useState<[number, number]>([0, 100]);
  const [prixMax, setPrixMax] = useState(999);

  // Computed max price from data
  const maxPrixFromData = useMemo(() => {
    if (alternatives.length === 0) return 100;
    return Math.ceil(Math.max(...alternatives.map((a) => a.prix_vente_ht)));
  }, [alternatives]);

  // Fetch alternatives when drawer opens
  useEffect(() => {
    if (!isOpen || !currentRef || !categorie) return;

    setLoading(true);
    setError('');
    setAlternatives([]);

    fetch(`/api/alternatives?ref=${encodeURIComponent(currentRef)}&categorie=${encodeURIComponent(categorie)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Erreur chargement');
        return res.json();
      })
      .then((data) => {
        setAlternatives(data.alternatives || []);
        // Reset sliders
        const maxP = data.alternatives?.length
          ? Math.ceil(Math.max(...data.alternatives.map((a: Alternative) => a.prix_vente_ht)))
          : 100;
        setPrixMax(maxP);
        setEpaisseur([0, 100]);
        setGamme([0, 100]);
      })
      .catch(() => setError('Impossible de charger les alternatives.'))
      .finally(() => setLoading(false));

    // Fetch current product price for delta display
    fetch(`/api/pricing?ref=${encodeURIComponent(currentRef)}&qty=1`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.prix_unitaire_ht) setCurrentPrix(data.prix_unitaire_ht);
      })
      .catch(() => {});
  }, [isOpen, currentRef, categorie]);

  // Grammage ranges for epaisseur slider
  const grammageRange = useMemo(() => {
    const allGrammages = alternatives
      .map((a) => a.grammage)
      .filter((g): g is number => g !== null && g > 0);
    if (allGrammages.length === 0) return { min: 100, max: 400 };
    return { min: Math.min(...allGrammages), max: Math.max(...allGrammages) };
  }, [alternatives]);

  // Filtered alternatives
  const filtered = useMemo(() => {
    const gMin = grammageRange.min + ((grammageRange.max - grammageRange.min) * epaisseur[0]) / 100;
    const gMax = grammageRange.min + ((grammageRange.max - grammageRange.min) * epaisseur[1]) / 100;
    const pMin = (gamme[0] / 100) * 100;
    const pMax = (gamme[1] / 100) * 100;

    return alternatives.filter((a) => {
      // Grammage filter (skip if product has no grammage)
      if (a.grammage !== null && a.grammage > 0) {
        if (a.grammage < gMin || a.grammage > gMax) return false;
      }
      // Gamme filter (score_premium 0-100)
      if (a.score_premium < pMin || a.score_premium > pMax) return false;
      // Prix filter
      if (a.prix_vente_ht > prixMax) return false;
      return true;
    });
  }, [alternatives, epaisseur, gamme, prixMax, grammageRange]);

  const formatDelta = (prix: number) => {
    if (currentPrix === null) return null;
    const delta = prix - currentPrix;
    if (Math.abs(delta) < 0.01) return null;
    const sign = delta > 0 ? '+' : '';
    return {
      text: `${sign}${delta.toFixed(2)}\u00A0\u20AC`,
      positive: delta > 0,
    };
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[380px] bg-white z-50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-neutral-400">Remplacer</p>
                <p className="text-sm font-medium text-neutral-900 truncate">{currentNom}</p>
              </div>
              <button
                onClick={onClose}
                className="ml-3 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900 transition-colors flex-shrink-0"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Filters */}
            <div className="px-5 py-4 space-y-4 border-b border-neutral-100">
              {/* Epaisseur */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-neutral-700">Epaisseur</label>
                  <span className="text-[10px] text-neutral-400">
                    {grammageRange.min !== grammageRange.max
                      ? `${Math.round(grammageRange.min + ((grammageRange.max - grammageRange.min) * epaisseur[0]) / 100)}–${Math.round(grammageRange.min + ((grammageRange.max - grammageRange.min) * epaisseur[1]) / 100)} g/m²`
                      : `${grammageRange.min} g/m²`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-neutral-400 w-10">Leger</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={epaisseur[1]}
                    onChange={(e) => setEpaisseur([epaisseur[0], parseInt(e.target.value)])}
                    className="flex-1 accent-neutral-900"
                  />
                  <span className="text-[10px] text-neutral-400 w-10 text-right">Lourd</span>
                </div>
              </div>

              {/* Gamme */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-neutral-700">Gamme</label>
                  <span className="text-[10px] text-neutral-400">
                    {gamme[0]}–{gamme[1]}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-neutral-400 w-14">Essentiel</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={gamme[1]}
                    onChange={(e) => setGamme([gamme[0], parseInt(e.target.value)])}
                    className="flex-1 accent-neutral-900"
                  />
                  <span className="text-[10px] text-neutral-400 w-14 text-right">Premium</span>
                </div>
              </div>

              {/* Prix max */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-neutral-700">Prix max</label>
                  <span className="text-[10px] text-neutral-400 tabular-nums">
                    {prixMax.toFixed(2)} €
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={maxPrixFromData}
                  step={0.5}
                  value={prixMax}
                  onChange={(e) => setPrixMax(parseFloat(e.target.value))}
                  className="w-full accent-neutral-900"
                />
              </div>
            </div>

            {/* Product list */}
            <div className="flex-1 overflow-y-auto">
              {loading && (
                <div className="p-5 space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="flex gap-3 animate-pulse">
                      <div className="w-16 h-16 bg-neutral-100 rounded-lg flex-shrink-0" />
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-3 bg-neutral-100 rounded w-3/4" />
                        <div className="h-3 bg-neutral-100 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <div className="p-5 text-center">
                  <p className="text-sm text-neutral-400">{error}</p>
                </div>
              )}

              {!loading && !error && filtered.length === 0 && (
                <div className="p-5 text-center py-12">
                  <p className="text-sm text-neutral-400">Aucune alternative trouvee</p>
                  <p className="text-xs text-neutral-300 mt-1">Essayez d&apos;elargir vos filtres</p>
                </div>
              )}

              {!loading && !error && filtered.length > 0 && (
                <div className="divide-y divide-neutral-100">
                  {filtered.map((alt) => {
                    const delta = formatDelta(alt.prix_vente_ht);
                    return (
                      <div key={alt.ref} className="px-5 py-3 hover:bg-neutral-50 transition-colors">
                        <div className="flex gap-3">
                          {/* Image */}
                          <div className="relative w-16 h-16 bg-neutral-50 rounded-lg overflow-hidden flex-shrink-0">
                            {alt.image_url ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={alt.image_url}
                                alt={alt.nom}
                                className="absolute inset-0 w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-neutral-300">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-900 line-clamp-1">{alt.nom}</p>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {alt.grammage && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-600">
                                  {alt.grammage} g/m²
                                </span>
                              )}
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-600">
                                {alt.genre}
                              </span>
                            </div>

                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-neutral-900 tabular-nums">
                                  {alt.prix_vente_ht.toFixed(2)} €
                                </span>
                                {delta && (
                                  <span
                                    className={`text-xs tabular-nums ${
                                      delta.positive ? 'text-red-500' : 'text-emerald-600'
                                    }`}
                                  >
                                    {delta.text}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => onSelect(alt.ref, alt.nom, alt.image_url)}
                                className="px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-xl hover:bg-neutral-800 transition-colors"
                              >
                                Choisir
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer count */}
            {!loading && !error && alternatives.length > 0 && (
              <div className="px-5 py-3 border-t border-neutral-100 text-center">
                <p className="text-xs text-neutral-400">
                  {filtered.length} alternative{filtered.length > 1 ? 's' : ''} sur {alternatives.length}
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
