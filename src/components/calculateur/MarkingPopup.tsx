'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { getZonesForCategory, TECHNIQUES, type MarkingZone, type TechniqueId } from '@/lib/marking-zones';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface MarkingZoneConfig {
  zoneId: string;
  technique: string;
  largeur_cm: number;
  nb_couleurs: number;
  prix_unitaire: number;
  frais_technique: number;
}

export interface MarkingConfig {
  zones: MarkingZoneConfig[];
  total_marquage_ht: number;
}

interface MarkingPopupProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    ref: string;
    nom: string;
    image_url: string;
    categorie: string;
    marquage_dispo?: string[];
  };
  qty: number;
  deadline?: string;
  onConfirm: (config: MarkingConfig) => void;
}

interface PricingRow {
  technique: string;
  position: string;
  prix_unitaire: number;
  frais_technique: number;
  delai_jours: number;
}

// ─── Pricing cache ──────────────────────────────────────────────────────────

const pricingCache = new Map<string, PricingRow[]>();

async function fetchMarkingPricing(
  technique: string,
  position: string,
  qty: number,
): Promise<PricingRow[]> {
  const key = `${technique}:${position}:${qty}`;
  if (pricingCache.has(key)) return pricingCache.get(key)!;
  try {
    const res = await fetch(`/api/marking-pricing?technique=${technique}&position=${position}&qty=${qty}`);
    if (!res.ok) return [];
    const data = await res.json();
    const rows: PricingRow[] = data.rows ?? [];
    pricingCache.set(key, rows);
    return rows;
  } catch {
    return [];
  }
}

function formatEur(n: number): string {
  return n.toFixed(2).replace('.', ',');
}

// ─── Component ──────────────────────────────────────────────────────────────

export function MarkingPopup({ isOpen, onClose, product, qty, deadline, onConfirm }: MarkingPopupProps) {
  const zones = getZonesForCategory(product.categorie);

  const availableTechniques = product.marquage_dispo?.length
    ? TECHNIQUES.filter((t) => product.marquage_dispo!.includes(t.id))
    : [...TECHNIQUES];

  // State par zone : technique, nb couleurs, prix
  const [configs, setConfigs] = useState<Map<string, { technique: TechniqueId; nb_couleurs: number }>>(new Map());
  const [pricing, setPricing] = useState<Map<string, { prix_unitaire: number; frais_technique: number; delai_jours: number }>>(new Map());
  const [loading, setLoading] = useState<Set<string>>(new Set());

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setConfigs(new Map());
      setPricing(new Map());
      setLoading(new Set());
    }
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Fetch pricing
  const loadPrice = useCallback(async (zoneId: string, technique: TechniqueId) => {
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return;
    const key = `${zoneId}:${technique}`;
    setLoading(prev => new Set(prev).add(key));

    const rows = await fetchMarkingPricing(technique, zone.pricingPosition, qty);
    if (rows.length > 0) {
      const best = rows.reduce((a, b) => a.prix_unitaire < b.prix_unitaire ? a : b);
      setPricing(prev => { const m = new Map(prev); m.set(key, best); return m; });
    } else {
      setPricing(prev => { const m = new Map(prev); m.delete(key); return m; });
    }
    setLoading(prev => { const s = new Set(prev); s.delete(key); return s; });
  }, [zones, qty]);

  // Toggle zone
  const toggleZone = (zoneId: string) => {
    if (configs.has(zoneId)) {
      setConfigs(prev => { const m = new Map(prev); m.delete(zoneId); return m; });
    } else {
      const defaultTech = availableTechniques[0]?.id ?? 'broderie';
      setConfigs(prev => { const m = new Map(prev); m.set(zoneId, { technique: defaultTech as TechniqueId, nb_couleurs: 1 }); return m; });
      loadPrice(zoneId, defaultTech as TechniqueId);
    }
  };

  const updateTechnique = (zoneId: string, technique: TechniqueId) => {
    setConfigs(prev => {
      const m = new Map(prev);
      const cur = m.get(zoneId);
      m.set(zoneId, { nb_couleurs: cur?.nb_couleurs ?? 1, technique });
      return m;
    });
    loadPrice(zoneId, technique);
  };

  const updateCouleurs = (zoneId: string, nb: number) => {
    setConfigs(prev => {
      const m = new Map(prev);
      const cur = m.get(zoneId);
      if (cur) m.set(zoneId, { ...cur, nb_couleurs: Math.max(1, Math.min(12, nb)) });
      return m;
    });
  };

  // Build total
  const buildConfig = (): MarkingConfig => {
    const zoneConfigs: MarkingZoneConfig[] = [];
    let total = 0;
    configs.forEach((cfg, zoneId) => {
      const zone = zones.find(z => z.id === zoneId);
      const pKey = `${zoneId}:${cfg.technique}`;
      const p = pricing.get(pKey);
      const pu = p?.prix_unitaire ?? 0;
      const ft = p?.frais_technique ?? 0;
      // Pour broderie : majoration par couleur supplémentaire (+15% par couleur au-dessus de 1)
      const colorMultiplier = cfg.technique === 'broderie' ? 1 + (cfg.nb_couleurs - 1) * 0.15 : 1;
      const puAdjusted = Math.ceil(pu * colorMultiplier * 100) / 100;

      zoneConfigs.push({
        zoneId,
        technique: cfg.technique,
        largeur_cm: zone?.defaultLargeurCm ?? 7,
        nb_couleurs: cfg.nb_couleurs,
        prix_unitaire: puAdjusted,
        frais_technique: ft,
      });
      total += puAdjusted * qty + ft;
    });
    return { zones: zoneConfigs, total_marquage_ht: Math.ceil(total * 100) / 100 };
  };

  const config = buildConfig();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-neutral-900 truncate">{product.nom}</h2>
            <p className="text-xs text-neutral-400">Marquage — {qty} pce{qty > 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Image produit (simple, pas de SVG overlay) */}
        {product.image_url && (
          <div className="px-5 pt-4">
            <div className="relative w-32 h-32 mx-auto bg-neutral-50 rounded-lg overflow-hidden">
              <Image src={product.image_url} alt={product.nom} fill className="object-contain" sizes="128px" />
            </div>
          </div>
        )}

        {/* Zones — boutons simples */}
        <div className="px-5 py-4">
          <p className="text-xs text-neutral-500 mb-3">Où placer le marquage ?</p>
          <div className="flex flex-wrap gap-2">
            {zones.map(zone => {
              const active = configs.has(zone.id);
              return (
                <button
                  key={zone.id}
                  onClick={() => toggleZone(zone.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-full border transition-colors ${
                    active
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-200 text-neutral-700 hover:border-neutral-400'
                  }`}
                >
                  {zone.label}
                  {active && <span className="ml-1.5 text-xs opacity-75">({zone.defaultLargeurCm}cm)</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Config par zone active */}
        {Array.from(configs.entries()).map(([zoneId, cfg]) => {
          const zone = zones.find(z => z.id === zoneId);
          const pKey = `${zoneId}:${cfg.technique}`;
          const p = pricing.get(pKey);
          const isLoading = loading.has(pKey);
          const colorMultiplier = cfg.technique === 'broderie' ? 1 + (cfg.nb_couleurs - 1) * 0.15 : 1;
          const puAdjusted = p ? Math.ceil(p.prix_unitaire * colorMultiplier * 100) / 100 : 0;
          const lineTotal = p ? puAdjusted * qty + p.frais_technique : 0;

          return (
            <div key={zoneId} className="px-5 pb-3">
              <div className="border border-neutral-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-neutral-900">{zone?.label}</p>
                  <button onClick={() => toggleZone(zoneId)} className="text-xs text-red-500 hover:text-red-700">Retirer</button>
                </div>

                {/* Technique */}
                <div className="flex gap-2">
                  {availableTechniques.map(t => (
                    <button
                      key={t.id}
                      onClick={() => updateTechnique(zoneId, t.id)}
                      className={`flex-1 px-2 py-2 text-xs font-medium rounded-lg transition-colors ${
                        cfg.technique === t.id
                          ? 'bg-neutral-900 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      {t.label}
                      <span className="block text-[10px] opacity-60 mt-0.5">{t.sub}</span>
                    </button>
                  ))}
                </div>

                {/* Nb couleurs (broderie seulement) */}
                {cfg.technique === 'broderie' && (
                  <div>
                    <label className="text-xs text-neutral-500 block mb-1">Nombre de couleurs de fils</label>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateCouleurs(zoneId, cfg.nb_couleurs - 1)} className="px-2 py-1 border border-neutral-200 rounded text-sm hover:bg-neutral-50">-</button>
                      <span className="text-sm font-semibold w-8 text-center">{cfg.nb_couleurs}</span>
                      <button onClick={() => updateCouleurs(zoneId, cfg.nb_couleurs + 1)} className="px-2 py-1 border border-neutral-200 rounded text-sm hover:bg-neutral-50">+</button>
                      {cfg.nb_couleurs > 1 && <span className="text-[10px] text-neutral-400">+{Math.round((cfg.nb_couleurs - 1) * 15)}% sur le prix</span>}
                    </div>
                  </div>
                )}

                {/* Prix */}
                <div className="bg-neutral-50 rounded-lg p-3">
                  {isLoading ? (
                    <div className="w-32 h-4 bg-neutral-200 rounded animate-pulse" />
                  ) : p ? (
                    <div className="flex items-center justify-between">
                      <p className="text-sm">
                        <span className="font-semibold text-neutral-900">{formatEur(puAdjusted)} €/pce</span>
                        <span className="text-neutral-400 mx-1">+</span>
                        <span className="text-neutral-500">{formatEur(p.frais_technique)} € setup</span>
                      </p>
                      <p className="text-sm font-semibold text-neutral-900">{formatEur(lineTotal)} €</p>
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-400">
                      {cfg.technique === 'serigraphie' && qty < 25
                        ? 'Sérigraphie disponible à partir de 25 pièces'
                        : 'Tarif indisponible — contactez-nous'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Total + validation */}
        <div className="px-5 pb-5 pt-2">
          {configs.size > 0 && (
            <div className="flex items-center justify-between mb-4 px-1">
              <span className="text-sm font-medium text-neutral-700">Total marquage HT</span>
              <span className="text-lg font-bold text-neutral-900">{formatEur(config.total_marquage_ht)} €</span>
            </div>
          )}

          <button
            onClick={() => { onConfirm(config); onClose(); }}
            disabled={configs.size === 0}
            className="w-full py-3 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {configs.size === 0 ? 'Sélectionnez une zone' : 'Valider le marquage'}
          </button>
        </div>
      </div>
    </div>
  );
}
