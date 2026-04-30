'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlternativesDrawer } from './AlternativesDrawer';
import { MarkingPopup, type MarkingConfig } from './MarkingPopup';
import { SizeDistributionPopup } from './SizeDistributionPopup';
import { DevisContactModal, DevisContact } from '@/components/devis/DevisContactModal';

interface Product {
  nom: string;
  ref_fournisseur: string;
  image_url?: string;
  categorie?: string;
  variantes?: { sku?: string; couleur?: string; taille?: string; stock?: boolean | null }[];
  marquage_dispo?: string[];
}

interface Paire {
  refA: string;
  refB: string;
}

interface LinePricing {
  ref: string;
  nom: string;
  qteParPersonne: number;
  qty: number;
  prix_unitaire_ht: number;
  total_ht: number;
  loading: boolean;
  error: string;
  // Pour les paires H/F
  varianteRef?: string;
  varianteNom?: string;
  repartH: number; // nb de personnes en version "principale"
  repartF: number; // nb de personnes en version "variante"
  sizeDistribution?: Record<string, number>; // { 'S': 3, 'M': 5, 'L': 8 }
}

interface CalculateurMultiClientProps {
  products: Product[];
  paires?: Paire[];
}

// Détecte si un nom contient Homme/Femme
function detectGenreLabel(nom: string): string {
  const lower = nom.toLowerCase();
  if (lower.includes(' femme') || lower.includes(' lady')) return 'Femme';
  if (lower.includes(' homme') || lower.includes(' men')) return 'Homme';
  return 'Unisexe';
}

export function CalculateurMultiClient({ products, paires = [] }: CalculateurMultiClientProps) {
  const [nbPersonnes, setNbPersonnes] = useState(10);

  // Construire les lignes initiales (une par produit principal, pas de doublon pour les variantes)
  const buildInitialLines = (): LinePricing[] => {
    const varianteRefs = new Set(paires.map(p => p.refB));
    const mainProducts = products.filter(p => !varianteRefs.has(p.ref_fournisseur));

    return mainProducts.map((p) => {
      const paire = paires.find(pa => pa.refA === p.ref_fournisseur || pa.refB === p.ref_fournisseur);
      const varianteProduct = paire
        ? products.find(v => v.ref_fournisseur === (paire.refA === p.ref_fournisseur ? paire.refB : paire.refA))
        : undefined;

      return {
        ref: p.ref_fournisseur,
        nom: p.nom,
        qteParPersonne: 1,
        qty: 10,
        prix_unitaire_ht: 0,
        total_ht: 0,
        loading: true,
        error: '',
        varianteRef: varianteProduct?.ref_fournisseur,
        varianteNom: varianteProduct?.nom,
        repartH: Math.ceil(10 / 2),
        repartF: Math.floor(10 / 2),
      };
    });
  };

  const [lines, setLines] = useState<LinePricing[]>(buildInitialLines);
  const [, setVariantePricing] = useState<Map<string, { prix_unitaire_ht: number; total_ht: number }>>(new Map());
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [devisError, setDevisError] = useState('');

  // Drawer alternatives
  const [drawerOpen, setDrawerOpen] = useState<{ index: number; ref: string; nom: string; categorie: string } | null>(null);

  // Popup marquage
  const [markingOpen, setMarkingOpen] = useState<{ index: number } | null>(null);
  const [markingConfigs, setMarkingConfigs] = useState<Map<number, MarkingConfig>>(new Map());

  // Popup tailles
  const [sizeOpen, setSizeOpen] = useState<{ index: number } | null>(null);

  const fetchPricing = useCallback(async (ref: string, qty: number) => {
    if (qty <= 0) return { prix_unitaire_ht: 0, total_ht: 0, error: '' };
    try {
      const res = await fetch(`/api/pricing?ref=${ref}&qty=${qty}`);
      if (!res.ok) return { prix_unitaire_ht: 0, total_ht: 0, error: 'Prix sur devis' };
      const data = await res.json();
      return { prix_unitaire_ht: data.prix_unitaire_ht, total_ht: data.total_ht, error: '' };
    } catch {
      return { prix_unitaire_ht: 0, total_ht: 0, error: 'Erreur' };
    }
  }, []);

  // Charger les prix au montage
  useEffect(() => {
    lines.forEach(async (line, i) => {
      if (line.varianteRef) {
        // Paire H/F : charger les deux refs
        const qtyH = line.qteParPersonne * line.repartH;
        const qtyF = line.qteParPersonne * line.repartF;
        const [resH, resF] = await Promise.all([
          fetchPricing(line.ref, qtyH),
          fetchPricing(line.varianteRef, qtyF),
        ]);
        setLines((prev) => {
          const updated = [...prev];
          updated[i] = {
            ...updated[i],
            prix_unitaire_ht: resH.prix_unitaire_ht,
            total_ht: resH.total_ht + resF.total_ht,
            loading: false,
            error: resH.error || resF.error,
          };
          return updated;
        });
        setVariantePricing((prev) => {
          const m = new Map(prev);
          m.set(line.varianteRef!, { prix_unitaire_ht: resF.prix_unitaire_ht, total_ht: resF.total_ht });
          return m;
        });
      } else {
        const result = await fetchPricing(line.ref, line.qty);
        setLines((prev) => {
          const updated = [...prev];
          updated[i] = { ...updated[i], ...result, loading: false };
          return updated;
        });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recalcLine = useCallback(async (line: LinePricing, index: number, nb: number) => {
    if (line.varianteRef) {
      const qtyH = line.qteParPersonne * line.repartH;
      const qtyF = line.qteParPersonne * line.repartF;
      const [resH, resF] = await Promise.all([
        fetchPricing(line.ref, qtyH),
        fetchPricing(line.varianteRef, qtyF),
      ]);
      setLines((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          qty: line.qteParPersonne * nb,
          prix_unitaire_ht: resH.prix_unitaire_ht,
          total_ht: resH.total_ht + resF.total_ht,
          loading: false,
          error: resH.error || resF.error,
        };
        return updated;
      });
      setVariantePricing((prev) => {
        const m = new Map(prev);
        m.set(line.varianteRef!, { prix_unitaire_ht: resF.prix_unitaire_ht, total_ht: resF.total_ht });
        return m;
      });
    } else {
      const totalQty = line.qteParPersonne * nb;
      const result = await fetchPricing(line.ref, totalQty);
      setLines((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], ...result, qty: totalQty, loading: false };
        return updated;
      });
    }
  }, [fetchPricing]);

  const updateQteParPersonne = (index: number, qteParPersonne: number) => {
    if (qteParPersonne < 0) return;
    setLines((prev) => {
      const updated = [...prev];
      const totalQty = qteParPersonne * nbPersonnes;
      updated[index] = { ...updated[index], qteParPersonne, qty: totalQty, loading: totalQty > 0 };
      return updated;
    });
    if (qteParPersonne === 0) {
      setLines((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], prix_unitaire_ht: 0, total_ht: 0, loading: false };
        return updated;
      });
      return;
    }
    const line = { ...lines[index], qteParPersonne };
    setTimeout(() => recalcLine(line, index, nbPersonnes), 300);
  };

  const updateRepart = (index: number, repartH: number) => {
    const repartF = nbPersonnes - repartH;
    if (repartH < 0 || repartF < 0) return;
    setLines((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], repartH, repartF, loading: true };
      return updated;
    });
    const line = { ...lines[index], repartH, repartF };
    setTimeout(() => recalcLine(line, index, nbPersonnes), 300);
  };

  const updateNbPersonnes = (nb: number) => {
    if (nb < 1) return;
    setNbPersonnes(nb);
    lines.forEach((line, i) => {
      const newRepartH = Math.ceil(nb * (line.repartH / (line.repartH + line.repartF || 1)));
      const newRepartF = nb - newRepartH;
      const updatedLine = { ...line, repartH: line.varianteRef ? newRepartH : nb, repartF: line.varianteRef ? newRepartF : 0 };
      setLines((prev) => {
        const updated = [...prev];
        updated[i] = { ...updated[i], repartH: updatedLine.repartH, repartF: updatedLine.repartF, qty: line.qteParPersonne * nb, loading: line.qteParPersonne > 0 };
        return updated;
      });
      if (line.qteParPersonne > 0) {
        setTimeout(() => recalcLine(updatedLine, i, nb), 300);
      }
    });
  };

  const totalMarquage = Array.from(markingConfigs.values()).reduce((sum, c) => sum + c.total_marquage_ht, 0);
  const totalHT = lines.reduce((sum, l) => sum + l.total_ht, 0) + totalMarquage;
  const francoPort = 500;
  const fraisPort = totalHT >= francoPort ? 0 : 19.90;
  const totalAvecPort = totalHT + fraisPort;
  const tva = totalAvecPort * 0.2;
  const totalTTC = totalAvecPort + tva;
  const allLoaded = lines.every((l) => !l.loading);

  const openDevisModal = () => {
    setDevisError('');
    setModalOpen(true);
  };

  const submitDevis = async (contact: DevisContact) => {
    setSubmitting(true);
    setDevisError('');
    try {
      // Générer les lignes du devis (éclater les paires H/F en 2 lignes)
      const devisLignes: { ref: string; qty: number }[] = [];
      for (const line of lines) {
        if (line.qteParPersonne === 0) continue;
        if (line.varianteRef) {
          const qtyH = line.qteParPersonne * line.repartH;
          const qtyF = line.qteParPersonne * line.repartF;
          if (qtyH > 0) devisLignes.push({ ref: line.ref, qty: qtyH });
          if (qtyF > 0) devisLignes.push({ ref: line.varianteRef, qty: qtyF });
        } else {
          devisLignes.push({ ref: line.ref, qty: line.qty });
        }
      }

      const res = await fetch('/api/devis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact, lignes: devisLignes }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Erreur ${res.status}`);
      }
      const data = await res.json();
      setModalOpen(false);
      window.open(`/api/devis/pdf?token=${data.share_token}`, '_blank');
    } catch (e: any) {
      setDevisError(e.message || 'Erreur lors de la génération du devis');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Nombre de personnes */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          Nombre de personnes à équiper
        </label>
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-neutral-200 rounded-lg bg-white">
            <button
              onClick={() => updateNbPersonnes(Math.max(1, nbPersonnes - 1))}
              className="px-3 py-2 text-neutral-500 hover:text-neutral-900 text-sm"
            >
              -
            </button>
            <input
              type="number"
              value={nbPersonnes}
              onChange={(e) => updateNbPersonnes(parseInt(e.target.value) || 1)}
              className="w-16 text-center text-sm font-semibold text-neutral-900 border-x border-neutral-200 py-2 focus:outline-none"
            />
            <button
              onClick={() => updateNbPersonnes(nbPersonnes + 1)}
              className="px-3 py-2 text-neutral-500 hover:text-neutral-900 text-sm"
            >
              +
            </button>
          </div>
          <span className="text-sm text-neutral-500">personne{nbPersonnes > 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Lignes produit */}
      {lines.map((line, i) => {
        const product = products.find((p) => p.ref_fournisseur === line.ref);
        const genreA = detectGenreLabel(line.nom);
        const genreB = line.varianteNom ? detectGenreLabel(line.varianteNom) : '';
        const hasPaire = !!line.varianteRef;

        return (
          <div key={line.ref} className="border border-neutral-100 rounded-xl p-4 space-y-3">
            <div className="flex gap-4 items-start">
              {product?.image_url && (
                <div className="relative w-16 h-16 bg-neutral-50 rounded-lg overflow-hidden flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.image_url} alt={line.nom} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-neutral-900 line-clamp-1">
                  {line.nom.replace(/ (Homme|Femme|Lady|Men)/, '')}
                </h3>
                <p className="text-xs text-neutral-400">
                  Réf. {line.ref}
                  {hasPaire && <> / {line.varianteRef}</>}
                </p>
                <div className="flex gap-2 mt-1.5">
                  <button
                    onClick={() => setDrawerOpen({ index: i, ref: line.ref, nom: line.nom, categorie: product?.categorie || '' })}
                    className="text-[10px] text-neutral-400 hover:text-neutral-900 underline underline-offset-2"
                  >
                    Changer
                  </button>
                  <button
                    onClick={() => setMarkingOpen({ index: i })}
                    className="text-[10px] text-neutral-400 hover:text-neutral-900 underline underline-offset-2"
                  >
                    Personnaliser
                  </button>
                  {line.qty > 0 && (
                    <button
                      onClick={() => setSizeOpen({ index: i })}
                      className="text-[10px] text-neutral-400 hover:text-neutral-900 underline underline-offset-2"
                    >
                      {line.sizeDistribution ? 'Tailles ✓' : 'Tailles'}
                    </button>
                  )}
                  {markingConfigs.has(i) && (
                    <span className="text-[10px] text-emerald-600">
                      +{markingConfigs.get(i)!.total_marquage_ht.toFixed(2)} € marquage
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-3">
                  <label className="text-xs text-neutral-500 whitespace-nowrap">Par pers.</label>
                  <div className="flex items-center border border-neutral-200 rounded-lg">
                    <button
                      onClick={() => updateQteParPersonne(i, Math.max(0, line.qteParPersonne - 1))}
                      className="px-2.5 py-1.5 text-neutral-500 hover:text-neutral-900 text-sm"
                    >-</button>
                    <input
                      type="number"
                      value={line.qteParPersonne}
                      onChange={(e) => updateQteParPersonne(i, parseInt(e.target.value) || 0)}
                      className="w-12 text-center text-sm font-medium text-neutral-900 border-x border-neutral-200 py-1.5 focus:outline-none"
                    />
                    <button
                      onClick={() => updateQteParPersonne(i, line.qteParPersonne + 1)}
                      className="px-2.5 py-1.5 text-neutral-500 hover:text-neutral-900 text-sm"
                    >+</button>
                  </div>
                  <span className="text-[10px] text-neutral-400">= {line.qty} pces</span>

                  <div className="ml-auto text-right">
                    {line.loading ? (
                      <div className="w-16 h-5 bg-neutral-100 rounded animate-pulse" />
                    ) : line.error ? (
                      <span className="text-xs text-neutral-400">{line.error}</span>
                    ) : line.qty === 0 ? (
                      <span className="text-xs text-neutral-300">—</span>
                    ) : (
                      <p className="text-sm font-semibold text-neutral-900 tabular-nums">
                        {line.total_ht.toFixed(2)} €
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Répartition H/F */}
            {hasPaire && line.qteParPersonne > 0 && (
              <div className="bg-neutral-50 rounded-lg p-3">
                <p className="text-xs text-neutral-500 mb-2">Répartition</p>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] text-neutral-400 block mb-1">{genreA}</label>
                    <input
                      type="range"
                      min={0}
                      max={nbPersonnes}
                      value={line.repartH}
                      onChange={(e) => updateRepart(i, parseInt(e.target.value))}
                      className="w-full accent-neutral-900"
                    />
                  </div>
                  <div className="text-center min-w-[80px]">
                    <span className="text-sm font-semibold text-neutral-900">{line.repartH}</span>
                    <span className="text-xs text-neutral-400 mx-1">/</span>
                    <span className="text-sm font-semibold text-neutral-900">{line.repartF}</span>
                  </div>
                  <div className="flex-1 text-right">
                    <label className="text-[10px] text-neutral-400 block mb-1">{genreB}</label>
                  </div>
                </div>
                <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
                  <span>{line.repartH * line.qteParPersonne} pces</span>
                  <span>{line.repartF * line.qteParPersonne} pces</span>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Récapitulatif */}
      {allLoaded && totalHT > 0 && (
        <div className="border border-neutral-200 rounded-xl divide-y divide-neutral-100">
          <div className="flex justify-between px-5 py-3">
            <span className="text-sm text-neutral-500">Sous-total HT</span>
            <span className="text-sm font-medium text-neutral-900 tabular-nums">{totalHT.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between px-5 py-3">
            <span className="text-sm text-neutral-500">
              Frais de port
              {fraisPort === 0 && <span className="ml-1 text-emerald-600 font-medium">offerts</span>}
            </span>
            <span className="text-sm font-medium text-neutral-900 tabular-nums">{fraisPort.toFixed(2)} €</span>
          </div>
          {fraisPort > 0 && (
            <div className="px-5 py-2 bg-amber-50">
              <p className="text-xs text-amber-700">
                Plus que {(francoPort - totalHT).toFixed(2)} € pour la livraison offerte
              </p>
            </div>
          )}
          <div className="flex justify-between px-5 py-3">
            <span className="text-sm text-neutral-500">TVA (20%)</span>
            <span className="text-sm font-medium text-neutral-900 tabular-nums">{tva.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between px-5 py-4 bg-neutral-50 rounded-b-xl">
            <span className="text-base font-semibold text-neutral-900">Total TTC</span>
            <span className="text-xl font-bold text-neutral-900 tabular-nums">{totalTTC.toFixed(2)} €</span>
          </div>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={openDevisModal}
        disabled={submitting || !allLoaded || totalHT === 0}
        className="w-full py-3 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-wait transition-colors"
      >
        {submitting ? 'Génération en cours...' : 'Générer mon devis PDF'}
      </button>

      <DevisContactModal
        open={modalOpen}
        onCancel={() => { if (!submitting) setModalOpen(false); }}
        onSubmit={submitDevis}
        submitting={submitting}
        error={devisError}
      />
      <p className="text-xs text-neutral-400 text-center">
        Devis gratuit — validité 30 jours — {lines.length} produit{lines.length > 1 ? 's' : ''}
      </p>

      {/* Drawer alternatives */}
      {drawerOpen && (
        <AlternativesDrawer
          isOpen={true}
          onClose={() => setDrawerOpen(null)}
          currentRef={drawerOpen.ref}
          currentNom={drawerOpen.nom}
          categorie={drawerOpen.categorie}
          onSelect={async (newRef, newNom, newImageUrl) => {
            const idx = drawerOpen.index;
            // Remplacer le produit dans la ligne
            setLines((prev) => {
              const updated = [...prev];
              updated[idx] = { ...updated[idx], ref: newRef, nom: newNom, loading: true };
              return updated;
            });
            // Mettre à jour le produit dans la liste products (pour l'image)
            // Re-fetch pricing
            const result = await fetchPricing(newRef, lines[idx].qty);
            setLines((prev) => {
              const updated = [...prev];
              updated[idx] = { ...updated[idx], ...result, loading: false };
              return updated;
            });
            setDrawerOpen(null);
          }}
        />
      )}

      {/* Popup tailles */}
      {sizeOpen && (() => {
        const line = lines[sizeOpen.index];
        const product = products.find(p => p.ref_fournisseur === line.ref);
        const availableSizes = product?.variantes
          ? Array.from(new Set(product.variantes.map(v => v.taille).filter(Boolean) as string[]))
          : [];
        return (
          <SizeDistributionPopup
            isOpen={true}
            onClose={() => setSizeOpen(null)}
            productNom={line.nom}
            totalQty={line.qty}
            availableSizes={availableSizes.length > 0 ? availableSizes : ['XS', 'S', 'M', 'L', 'XL', 'XXL']}
            initialDistribution={line.sizeDistribution}
            onConfirm={(distribution) => {
              setLines(prev => {
                const updated = [...prev];
                updated[sizeOpen.index] = { ...updated[sizeOpen.index], sizeDistribution: distribution };
                return updated;
              });
              setSizeOpen(null);
            }}
          />
        );
      })()}

      {/* Popup marquage */}
      {markingOpen && (
        <MarkingPopup
          isOpen={true}
          onClose={() => setMarkingOpen(null)}
          product={{
            ref: lines[markingOpen.index].ref,
            nom: lines[markingOpen.index].nom,
            image_url: products.find(p => p.ref_fournisseur === lines[markingOpen.index].ref)?.image_url || '',
            categorie: products.find(p => p.ref_fournisseur === lines[markingOpen.index].ref)?.categorie || '',
          }}
          qty={lines[markingOpen.index].qty}
          onConfirm={(config) => {
            setMarkingConfigs((prev) => {
              const updated = new Map(prev);
              updated.set(markingOpen.index, config);
              return updated;
            });
            setMarkingOpen(null);
          }}
        />
      )}
    </div>
  );
}
