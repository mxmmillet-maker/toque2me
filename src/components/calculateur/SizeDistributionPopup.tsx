'use client';

import { useState, useMemo, useCallback } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface SizeDistributionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  productNom: string;
  totalQty: number;
  availableSizes: string[];
  initialDistribution?: Record<string, number>;
  onConfirm: (distribution: Record<string, number>) => void;
}

type TabId = 'manuel' | 'coller' | 'equipe';

// ─── Size ordering & normalization ──────────────────────────────────────────

const STANDARD_SIZE_ORDER = [
  'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL',
];

const SIZE_ALIASES: Record<string, string> = {
  // English
  'extra small': 'XS',
  'x-small': 'XS',
  'xsmall': 'XS',
  'small': 'S',
  'medium': 'M',
  'med': 'M',
  'large': 'L',
  'extra large': 'XL',
  'x-large': 'XL',
  'xlarge': 'XL',
  'extra extra large': 'XXL',
  'xx-large': 'XXL',
  'xxlarge': 'XXL',
  '2xl': 'XXL',
  '3xl': '3XL',
  '4xl': '4XL',
  '5xl': '5XL',
  // French
  'très petit': 'XS',
  'tres petit': 'XS',
  'petit': 'S',
  'moyen': 'M',
  'moyenne': 'M',
  'grand': 'L',
  'grande': 'L',
  'très grand': 'XL',
  'tres grand': 'XL',
  'extra grand': 'XL',
};

function normalizeSize(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const upper = trimmed.toUpperCase();
  // Direct match (XS, S, M, L, XL, XXL, 3XL, numeric...)
  if (STANDARD_SIZE_ORDER.includes(upper) || /^\d{2,3}$/.test(trimmed)) {
    return upper;
  }
  // Alias match
  const lower = trimmed.toLowerCase();
  if (SIZE_ALIASES[lower]) return SIZE_ALIASES[lower];
  return null;
}

function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => {
    const idxA = STANDARD_SIZE_ORDER.indexOf(a);
    const idxB = STANDARD_SIZE_ORDER.indexOf(b);
    // Both in standard order
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    // Standard sizes come first
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    // Numeric sizes
    const numA = parseInt(a);
    const numB = parseInt(b);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });
}

// ─── Parse logic for "Coller un tableau" ────────────────────────────────────

interface ParseResult {
  distribution: Record<string, number>;
  errors: string[];
}

function parsePastedData(text: string, availableSizes: string[]): ParseResult {
  const distribution: Record<string, number> = {};
  const errors: string[] = [];
  const availableUpper = new Set(availableSizes.map((s) => s.toUpperCase()));

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return { distribution, errors };

  for (const line of lines) {
    // Split by tab, semicolon, or 2+ spaces
    const parts = line.split(/\t|;|\s{2,}/).map((p) => p.trim()).filter(Boolean);

    if (parts.length === 0) continue;

    if (parts.length === 1) {
      // Single column: should be a size
      const normalized = normalizeSize(parts[0]);
      if (normalized && availableUpper.has(normalized)) {
        distribution[normalized] = (distribution[normalized] || 0) + 1;
      } else {
        errors.push(`"${parts[0]}" — taille non reconnue`);
      }
    } else if (parts.length >= 2) {
      const col1 = parts[0];
      const col2 = parts[1];

      // Try "Taille + Quantité" (second col is a number)
      const qty = parseInt(col2);
      if (!isNaN(qty) && qty > 0) {
        const normalized = normalizeSize(col1);
        if (normalized && availableUpper.has(normalized)) {
          distribution[normalized] = (distribution[normalized] || 0) + qty;
          continue;
        }
      }

      // Try "Nom + Taille" (second col is a valid size)
      const normalized2 = normalizeSize(col2);
      if (normalized2 && availableUpper.has(normalized2)) {
        distribution[normalized2] = (distribution[normalized2] || 0) + 1;
        continue;
      }

      // Try first col as size with second as qty (reversed check)
      const normalizedFirst = normalizeSize(col1);
      if (normalizedFirst && availableUpper.has(normalizedFirst) && !isNaN(qty) && qty > 0) {
        distribution[normalizedFirst] = (distribution[normalizedFirst] || 0) + qty;
        continue;
      }

      errors.push(`"${line}" — format non reconnu`);
    }
  }

  return { distribution, errors };
}

// ─── Component ──────────────────────────────────────────────────────────────

export function SizeDistributionPopup({
  isOpen,
  onClose,
  productNom,
  totalQty,
  availableSizes,
  initialDistribution,
  onConfirm,
}: SizeDistributionPopupProps) {
  const sortedSizes = useMemo(() => sortSizes(availableSizes), [availableSizes]);

  const [tab, setTab] = useState<TabId>('manuel');
  const [distribution, setDistribution] = useState<Record<string, number>>(() => {
    if (initialDistribution) return { ...initialDistribution };
    const init: Record<string, number> = {};
    for (const s of sortedSizes) init[s] = 0;
    return init;
  });
  const [pasteText, setPasteText] = useState('');
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  const distributed = useMemo(
    () => Object.values(distribution).reduce((sum, n) => sum + n, 0),
    [distribution],
  );
  const remaining = totalQty - distributed;
  const isValid = remaining === 0;

  // ─── Manual tab handlers ────────────────────────────────────────────

  const setSize = useCallback((size: string, qty: number) => {
    setDistribution((prev) => ({ ...prev, [size]: Math.max(0, qty) }));
  }, []);

  const distributeEvenly = useCallback(() => {
    if (sortedSizes.length === 0) return;
    const base = Math.floor(totalQty / sortedSizes.length);
    let remainder = totalQty % sortedSizes.length;
    const next: Record<string, number> = {};
    for (const s of sortedSizes) {
      next[s] = base + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;
    }
    setDistribution(next);
  }, [sortedSizes, totalQty]);

  // ─── Paste tab handler ─────────────────────────────────────────────

  const handleParse = useCallback(() => {
    const { distribution: parsed, errors } = parsePastedData(pasteText, availableSizes);
    // Merge into existing distribution shape (reset all to 0 first, then apply parsed)
    const next: Record<string, number> = {};
    for (const s of sortedSizes) next[s] = 0;
    for (const [size, qty] of Object.entries(parsed)) {
      if (next.hasOwnProperty(size)) {
        next[size] = qty;
      }
    }
    setDistribution(next);
    setParseErrors(errors);
    setTab('manuel');
  }, [pasteText, availableSizes, sortedSizes]);

  // ─── Render ─────────────────────────────────────────────────────────

  if (!isOpen) return null;

  const progressPct = totalQty > 0 ? Math.min((distributed / totalQty) * 100, 100) : 0;

  const tabs: { id: TabId; label: string; disabled?: boolean; badge?: string }[] = [
    { id: 'manuel', label: 'Manuel' },
    { id: 'coller', label: 'Coller un tableau' },
    { id: 'equipe', label: 'Mon équipe', disabled: true, badge: 'Bientôt' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-neutral-900 truncate">
              Répartition des tailles
            </h2>
            <p className="text-xs text-neutral-400 truncate mt-0.5">{productNom}</p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-900 transition-colors ml-3 flex-shrink-0"
            aria-label="Fermer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-100 px-5 gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => !t.disabled && setTab(t.id)}
              disabled={t.disabled}
              className={`
                relative px-3 py-2.5 text-xs font-medium transition-colors
                ${t.disabled ? 'text-neutral-300 cursor-not-allowed' : ''}
                ${!t.disabled && tab === t.id ? 'text-neutral-900' : ''}
                ${!t.disabled && tab !== t.id ? 'text-neutral-400 hover:text-neutral-700' : ''}
              `}
            >
              {t.label}
              {t.badge && (
                <span className="ml-1.5 inline-block text-[9px] bg-neutral-100 text-neutral-400 px-1.5 py-0.5 rounded-full">
                  {t.badge}
                </span>
              )}
              {tab === t.id && !t.disabled && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-neutral-900 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* ─── Tab: Manuel ──────────────────────────────────────────── */}
          {tab === 'manuel' && (
            <div className="space-y-3">
              {/* Quick actions */}
              <button
                onClick={distributeEvenly}
                className="text-xs text-neutral-500 hover:text-neutral-900 underline underline-offset-2 transition-colors"
              >
                Répartition égale
              </button>

              {/* Size rows */}
              <div className="space-y-2">
                {sortedSizes.map((size) => (
                  <div key={size} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-700 w-12">{size}</span>
                    <div className="flex items-center border border-neutral-200 rounded-lg">
                      <button
                        onClick={() => setSize(size, (distribution[size] || 0) - 1)}
                        className="px-2.5 py-1.5 text-neutral-500 hover:text-neutral-900 text-sm transition-colors"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={distribution[size] || 0}
                        onChange={(e) => setSize(size, parseInt(e.target.value) || 0)}
                        className="w-14 text-center text-sm font-medium text-neutral-900 border-x border-neutral-200 py-1.5 focus:outline-none tabular-nums"
                        min={0}
                      />
                      <button
                        onClick={() => setSize(size, (distribution[size] || 0) + 1)}
                        className="px-2.5 py-1.5 text-neutral-500 hover:text-neutral-900 text-sm transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Parse errors (shown after paste parse) */}
              {parseErrors.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-amber-800 mb-1">
                    {parseErrors.length} ligne{parseErrors.length > 1 ? 's' : ''} non reconnue{parseErrors.length > 1 ? 's' : ''}
                  </p>
                  <ul className="space-y-0.5">
                    {parseErrors.slice(0, 5).map((err, i) => (
                      <li key={i} className="text-[11px] text-amber-700">{err}</li>
                    ))}
                    {parseErrors.length > 5 && (
                      <li className="text-[11px] text-amber-600">
                        ...et {parseErrors.length - 5} autre{parseErrors.length - 5 > 1 ? 's' : ''}
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Progress */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-neutral-500 tabular-nums">
                    {distributed} / {totalQty} répartis
                  </span>
                  {remaining !== 0 && (
                    <span className={`text-xs font-medium ${remaining > 0 ? 'text-amber-600' : 'text-red-500'}`}>
                      {remaining > 0
                        ? `Il reste ${remaining} pièce${remaining > 1 ? 's' : ''} à répartir`
                        : `${Math.abs(remaining)} pièce${Math.abs(remaining) > 1 ? 's' : ''} en trop`
                      }
                    </span>
                  )}
                </div>
                <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      remaining === 0 ? 'bg-emerald-500' : remaining < 0 ? 'bg-red-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ─── Tab: Coller un tableau ───────────────────────────────── */}
          {tab === 'coller' && (
            <div className="space-y-4">
              <p className="text-xs text-neutral-500">
                Collez un tableau depuis Excel, Google Sheets ou un fichier CSV.
              </p>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={
                  'Collez votre tableau depuis Excel...\nFormat: Nom\tTaille  ou  Taille\tQuantité'
                }
                className="w-full h-40 border border-neutral-200 rounded-lg p-3 text-sm text-neutral-800 placeholder:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-300 resize-none"
              />
              <button
                onClick={handleParse}
                disabled={!pasteText.trim()}
                className="w-full py-2.5 text-sm font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Analyser
              </button>
              <div className="text-[11px] text-neutral-400 space-y-1">
                <p>Formats acceptés :</p>
                <ul className="list-disc list-inside space-y-0.5 ml-1">
                  <li>Une taille par ligne : S, M, L...</li>
                  <li>Nom + Taille : Jean Dupont → M</li>
                  <li>Taille + Quantité : M → 5</li>
                </ul>
              </div>
            </div>
          )}

          {/* ─── Tab: Mon équipe (disabled) ───────────────────────────── */}
          {tab === 'equipe' && (
            <div className="flex items-center justify-center h-32 text-neutral-300 text-sm">
              Bientôt disponible
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-neutral-100">
          {remaining !== 0 && (
            <p className={`text-xs mb-3 text-center font-medium ${remaining > 0 ? 'text-amber-600' : 'text-red-500'}`}>
              {remaining > 0
                ? `Il reste ${remaining} pièce${remaining > 1 ? 's' : ''} à répartir`
                : `${Math.abs(remaining)} pièce${Math.abs(remaining) > 1 ? 's' : ''} en trop`
              }
            </p>
          )}
          <button
            onClick={() => {
              // Only include sizes with qty > 0
              const cleaned: Record<string, number> = {};
              for (const [size, qty] of Object.entries(distribution)) {
                if (qty > 0) cleaned[size] = qty;
              }
              onConfirm(cleaned);
            }}
            disabled={!isValid}
            className="w-full py-3 text-sm font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Valider la répartition
          </button>
        </div>
      </div>
    </div>
  );
}
