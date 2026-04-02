'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Image from 'next/image';
import { getZonesForCategory, TECHNIQUES, type MarkingZone, type TechniqueId } from '@/lib/marking-zones';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface MarkingZoneConfig {
  zoneId: string;
  technique: string;
  largeur_cm: number;
  prix_unitaire: number;
  frais_technique: number;
}

export interface MarkingConfig {
  zones: MarkingZoneConfig[];
  /** sum of (prix_unitaire * qty) + frais_technique for each zone */
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
  qte_min: number;
  qte_max: number | null;
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
    const res = await fetch(
      `/api/marking-pricing?technique=${technique}&position=${position}&qty=${qty}`,
    );
    if (!res.ok) return [];
    const data = await res.json();
    const rows: PricingRow[] = data.rows ?? [];
    pricingCache.set(key, rows);
    return rows;
  } catch {
    return [];
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatEur(n: number): string {
  return n.toFixed(2).replace('.', ',');
}

function deadlineBadge(
  deadline: string | undefined,
  delaiJours: number,
): { label: string; color: string } | null {
  if (!deadline) return null;
  const now = new Date();
  const target = new Date(deadline);
  const diffDays = Math.ceil((target.getTime() - now.getTime()) / 86_400_000);

  if (diffDays >= delaiJours + 3) return { label: '\u2713 En temps', color: 'text-emerald-600 bg-emerald-50' };
  if (diffDays >= delaiJours) return { label: '\u26A0 Serre', color: 'text-amber-600 bg-amber-50' };
  return { label: '\u2717 Hors delai', color: 'text-red-600 bg-red-50' };
}

// ─── Zone colors ────────────────────────────────────────────────────────────

const ZONE_COLORS: Record<string, string> = {
  coeur: '#3b82f6',
  dos: '#8b5cf6',
  manche_gauche: '#f59e0b',
  manche_droite: '#ef4444',
  cuisse: '#3b82f6',
  centre: '#8b5cf6',
  face: '#3b82f6',
};

// ─── Component ──────────────────────────────────────────────────────────────

export function MarkingPopup({ isOpen, onClose, product, qty, deadline, onConfirm }: MarkingPopupProps) {
  const [activeFace, setActiveFace] = useState<'front' | 'back'>('front');
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [configuredZones, setConfiguredZones] = useState<Map<string, { technique: TechniqueId; largeur_cm: number }>>(new Map());
  const [pricing, setPricing] = useState<Map<string, { prix_unitaire: number; frais_technique: number; delai_jours: number }>>(new Map());
  const [pricingLoading, setPricingLoading] = useState<Set<string>>(new Set());
  const overlayRef = useRef<HTMLDivElement>(null);

  // Zones for this product
  const zones = useMemo(() => getZonesForCategory(product.categorie), [product.categorie]);
  const hasBothFaces = zones.some((z) => z.face === 'front') && zones.some((z) => z.face === 'back');
  const visibleZones = zones.filter((z) => z.face === activeFace);

  // Available techniques
  const availableTechniques = useMemo(() => {
    if (product.marquage_dispo && product.marquage_dispo.length > 0) {
      return TECHNIQUES.filter((t) => product.marquage_dispo!.includes(t.id));
    }
    return [...TECHNIQUES];
  }, [product.marquage_dispo]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setActiveFace('front');
      setSelectedZoneId(null);
      setConfiguredZones(new Map());
      setPricing(new Map());
      setPricingLoading(new Set());
    }
  }, [isOpen]);

  // Fetch pricing when a zone config changes
  const fetchPriceForZone = useCallback(
    async (zoneId: string, technique: TechniqueId) => {
      const zone = zones.find((z) => z.id === zoneId);
      if (!zone) return;

      const pKey = `${zoneId}:${technique}`;
      setPricingLoading((prev) => new Set(prev).add(pKey));

      const rows = await fetchMarkingPricing(technique, zone.pricingPosition, qty);

      if (rows.length > 0) {
        // Take best price (lowest prix_unitaire among matching rows)
        const best = rows.reduce((a, b) => (a.prix_unitaire < b.prix_unitaire ? a : b));
        setPricing((prev) => {
          const m = new Map(prev);
          m.set(pKey, {
            prix_unitaire: best.prix_unitaire,
            frais_technique: best.frais_technique,
            delai_jours: best.delai_jours,
          });
          return m;
        });
      } else {
        setPricing((prev) => {
          const m = new Map(prev);
          m.delete(pKey);
          return m;
        });
      }

      setPricingLoading((prev) => {
        const s = new Set(prev);
        s.delete(pKey);
        return s;
      });
    },
    [zones, qty],
  );

  // Handle zone click
  const handleZoneClick = (zoneId: string) => {
    if (selectedZoneId === zoneId) {
      setSelectedZoneId(null);
      return;
    }
    setSelectedZoneId(zoneId);

    // If not yet configured, set defaults
    if (!configuredZones.has(zoneId)) {
      const zone = zones.find((z) => z.id === zoneId);
      const defaultTechnique = availableTechniques[0]?.id ?? 'broderie';
      setConfiguredZones((prev) => {
        const m = new Map(prev);
        m.set(zoneId, { technique: defaultTechnique as TechniqueId, largeur_cm: zone?.defaultLargeurCm ?? 7 });
        return m;
      });
      fetchPriceForZone(zoneId, defaultTechnique as TechniqueId);
    }
  };

  // Handle technique change
  const handleTechniqueChange = (zoneId: string, technique: TechniqueId) => {
    setConfiguredZones((prev) => {
      const m = new Map(prev);
      const current = m.get(zoneId);
      m.set(zoneId, { largeur_cm: current?.largeur_cm ?? 7, technique });
      return m;
    });
    fetchPriceForZone(zoneId, technique);
  };

  // Handle largeur change
  const handleLargeurChange = (zoneId: string, largeur_cm: number) => {
    setConfiguredZones((prev) => {
      const m = new Map(prev);
      const current = m.get(zoneId);
      if (current) m.set(zoneId, { ...current, largeur_cm });
      return m;
    });
  };

  // Remove zone
  const handleRemoveZone = (zoneId: string) => {
    setConfiguredZones((prev) => {
      const m = new Map(prev);
      m.delete(zoneId);
      return m;
    });
    if (selectedZoneId === zoneId) setSelectedZoneId(null);
  };

  // Build total
  const buildConfig = (): MarkingConfig => {
    const zoneConfigs: MarkingZoneConfig[] = [];
    let total = 0;

    configuredZones.forEach((cfg, zoneId) => {
      const pKey = `${zoneId}:${cfg.technique}`;
      const p = pricing.get(pKey);
      const pu = p?.prix_unitaire ?? 0;
      const ft = p?.frais_technique ?? 0;

      zoneConfigs.push({
        zoneId,
        technique: cfg.technique,
        largeur_cm: cfg.largeur_cm,
        prix_unitaire: pu,
        frais_technique: ft,
      });

      total += pu * qty + ft;
    });

    return { zones: zoneConfigs, total_marquage_ht: Math.ceil(total * 100) / 100 };
  };

  const config = buildConfig();

  // Handle confirm
  const handleConfirm = () => {
    onConfirm(config);
    onClose();
  };

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const selectedZone = selectedZoneId ? zones.find((z) => z.id === selectedZoneId) : null;
  const selectedConfig = selectedZoneId ? configuredZones.get(selectedZoneId) : null;
  const selectedPricingKey = selectedZoneId && selectedConfig ? `${selectedZoneId}:${selectedConfig.technique}` : null;
  const selectedPricing = selectedPricingKey ? pricing.get(selectedPricingKey) : null;
  const selectedLoading = selectedPricingKey ? pricingLoading.has(selectedPricingKey) : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-neutral-900 truncate">{product.nom}</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Configurez le marquage - {qty} pce{qty > 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-400 hover:text-neutral-700 flex-shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Image + SVG overlay */}
        <div className="px-5 py-4">
          <div ref={overlayRef} className="relative w-full aspect-square max-w-xs mx-auto bg-neutral-50 rounded-lg overflow-hidden">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.nom}
                fill
                className="object-contain"
                sizes="320px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}

            {/* SVG overlay zones */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              {visibleZones.map((zone) => {
                const isConfigured = configuredZones.has(zone.id);
                const isSelected = selectedZoneId === zone.id;
                const color = ZONE_COLORS[zone.id] ?? '#3b82f6';

                return (
                  <g key={zone.id} className="pointer-events-auto cursor-pointer">
                    <rect
                      x={zone.x}
                      y={zone.y}
                      width={zone.w}
                      height={zone.h}
                      fill={isConfigured ? color : 'transparent'}
                      fillOpacity={isSelected ? 0.3 : isConfigured ? 0.15 : 0}
                      stroke={isConfigured ? color : '#6b7280'}
                      strokeWidth={isSelected ? 0.8 : 0.5}
                      strokeDasharray={isConfigured ? 'none' : '2 1'}
                      rx={1}
                      onClick={() => handleZoneClick(zone.id)}
                    />
                    <text
                      x={zone.x + zone.w / 2}
                      y={zone.y + zone.h / 2}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={3}
                      fill={isConfigured ? color : '#6b7280'}
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      className="pointer-events-none select-none"
                    >
                      {zone.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Face toggle */}
          {hasBothFaces && (
            <div className="flex justify-center gap-2 mt-3">
              <button
                onClick={() => { setActiveFace('front'); setSelectedZoneId(null); }}
                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  activeFace === 'front'
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                Face avant
              </button>
              <button
                onClick={() => { setActiveFace('back'); setSelectedZoneId(null); }}
                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  activeFace === 'back'
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                Face arriere
              </button>
            </div>
          )}
        </div>

        {/* Zone config panel */}
        {selectedZone && selectedConfig && (
          <div className="px-5 pb-4">
            <div className="border border-neutral-200 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-neutral-900">{selectedZone.label}</h3>
                <button
                  onClick={() => handleRemoveZone(selectedZone.id)}
                  className="text-xs text-red-500 hover:text-red-700 transition-colors"
                >
                  Supprimer
                </button>
              </div>

              {/* Technique selector */}
              <div>
                <label className="text-xs text-neutral-500 block mb-2">Technique</label>
                <div className="flex gap-2">
                  {availableTechniques.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleTechniqueChange(selectedZone.id, t.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        selectedConfig.technique === t.id
                          ? 'bg-neutral-900 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Largeur slider */}
              <div>
                <label className="text-xs text-neutral-500 block mb-2">
                  Largeur : <span className="font-medium text-neutral-900">{selectedConfig.largeur_cm} cm</span>
                </label>
                <input
                  type="range"
                  min={5}
                  max={30}
                  step={1}
                  value={selectedConfig.largeur_cm}
                  onChange={(e) => handleLargeurChange(selectedZone.id, parseInt(e.target.value))}
                  className="w-full accent-neutral-900"
                />
                <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
                  <span>5 cm</span>
                  <span>30 cm</span>
                </div>
              </div>

              {/* Pricing display */}
              <div className="bg-neutral-50 rounded-lg p-3">
                {selectedLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-4 bg-neutral-200 rounded animate-pulse" />
                    <div className="w-32 h-4 bg-neutral-200 rounded animate-pulse" />
                  </div>
                ) : selectedPricing ? (
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="text-sm text-neutral-900">
                      <span className="font-semibold">{formatEur(selectedPricing.prix_unitaire)} &euro;/pce</span>
                      <span className="text-neutral-400 mx-1">+</span>
                      <span className="text-neutral-600">{formatEur(selectedPricing.frais_technique)} &euro; frais technique</span>
                    </p>
                    {deadline && selectedPricing.delai_jours > 0 && (() => {
                      const badge = deadlineBadge(deadline, selectedPricing.delai_jours);
                      if (!badge) return null;
                      return (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.color}`}>
                          {badge.label}
                        </span>
                      );
                    })()}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400">
                    Tarif indisponible pour cette configuration (min. 25 pces en serigraphie)
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Configured zones summary */}
        {configuredZones.size > 0 && (
          <div className="px-5 pb-4">
            <div className="border border-neutral-100 rounded-xl divide-y divide-neutral-100">
              {Array.from(configuredZones.entries()).map(([zoneId, cfg]) => {
                const zone = zones.find((z) => z.id === zoneId);
                const pKey = `${zoneId}:${cfg.technique}`;
                const p = pricing.get(pKey);
                const techniqueLabel = TECHNIQUES.find((t) => t.id === cfg.technique)?.label ?? cfg.technique;
                const lineTotal = p ? p.prix_unitaire * qty + p.frais_technique : 0;

                return (
                  <div key={zoneId} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: ZONE_COLORS[zoneId] ?? '#3b82f6' }}
                      />
                      <span className="text-xs text-neutral-700 truncate">
                        {zone?.label ?? zoneId} - {techniqueLabel}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-neutral-900 tabular-nums flex-shrink-0 ml-2">
                      {p ? `${formatEur(lineTotal)} \u20AC` : '--'}
                    </span>
                  </div>
                );
              })}

              {/* Total */}
              <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 rounded-b-xl">
                <span className="text-sm font-medium text-neutral-700">Total marquage HT</span>
                <span className="text-sm font-bold text-neutral-900 tabular-nums">
                  {formatEur(config.total_marquage_ht)} &euro;
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            onClick={handleConfirm}
            disabled={configuredZones.size === 0}
            className="w-full py-3 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Valider le marquage
          </button>
          {configuredZones.size === 0 && (
            <p className="text-xs text-neutral-400 text-center mt-2">
              Cliquez sur une zone du produit pour configurer le marquage
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
