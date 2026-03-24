'use client';

import { useState, useEffect, useCallback } from 'react';
import { QuantitySlider } from './QuantitySlider';

interface PricingResult {
  ref: string;
  nom: string;
  qty: number;
  prix_unitaire_ht: number;
  total_ht: number;
  frais_port_ht: number;
  franco_port_ht: number;
  restant_franco: number;
  total_avec_port_ht: number;
  tva: number;
  total_ttc: number;
  tiers: { qte_min: number; qte_max: number | null; prix_vente_ht: number }[];
}

interface CalculateurClientProps {
  initialRef: string;
  productName: string;
}

export function CalculateurClient({ initialRef, productName }: CalculateurClientProps) {
  const [qty, setQty] = useState(50);
  const [pricing, setPricing] = useState<PricingResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPricing = useCallback(async (quantity: number) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/pricing?ref=${initialRef}&qty=${quantity}`);
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Erreur');
        setPricing(null);
        return;
      }
      const data = await res.json();
      setPricing(data);
    } catch {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }, [initialRef]);

  useEffect(() => {
    const timeout = setTimeout(() => fetchPricing(qty), 200);
    return () => clearTimeout(timeout);
  }, [qty, fetchPricing]);

  return (
    <div className="space-y-8">
      {/* Produit sélectionné */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Produit sélectionné</p>
        <h2 className="text-lg font-semibold text-neutral-900">{productName}</h2>
        <p className="text-xs text-neutral-400">Réf. {initialRef}</p>
      </div>

      {/* Quantité */}
      <QuantitySlider value={qty} onChange={setQty} />

      {/* Résultat */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error === 'no pricing' ? 'Prix sur devis pour ce produit. Contactez-nous.' : error}
        </div>
      )}

      {pricing && !error && (
        <div className="space-y-6">
          {/* Prix unitaire */}
          <div className="text-center py-6 bg-neutral-50 rounded-xl">
            <p className="text-sm text-neutral-400 mb-1">Prix unitaire HT</p>
            <p className="text-4xl font-bold text-neutral-900 tabular-nums">
              {pricing.prix_unitaire_ht.toFixed(2)}&nbsp;€
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              pour {pricing.qty} pièce{pricing.qty > 1 ? 's' : ''}
            </p>
          </div>

          {/* Paliers */}
          {pricing.tiers.length > 1 && (
            <div className="grid grid-cols-5 gap-px bg-neutral-100 rounded-lg overflow-hidden">
              {pricing.tiers.map((tier, i) => {
                const isActive = qty >= tier.qte_min && (tier.qte_max === null || qty <= tier.qte_max);
                return (
                  <div
                    key={i}
                    className={`p-3 text-center transition-colors ${
                      isActive ? 'bg-neutral-900 text-white' : 'bg-white'
                    }`}
                  >
                    <div className={`text-[11px] mb-1 ${isActive ? 'text-neutral-300' : 'text-neutral-400'}`}>
                      {tier.qte_max ? `${tier.qte_min}–${tier.qte_max}` : `${tier.qte_min}+`}
                    </div>
                    <div className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-neutral-900'}`}>
                      {tier.prix_vente_ht.toFixed(2)}&nbsp;€
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Récapitulatif */}
          <div className="border border-neutral-200 rounded-xl divide-y divide-neutral-100">
            <div className="flex justify-between px-5 py-3">
              <span className="text-sm text-neutral-500">Sous-total HT</span>
              <span className="text-sm font-medium text-neutral-900 tabular-nums">
                {pricing.total_ht.toFixed(2)} €
              </span>
            </div>
            <div className="flex justify-between px-5 py-3">
              <span className="text-sm text-neutral-500">
                Frais de port
                {pricing.frais_port_ht === 0 && (
                  <span className="ml-1 text-emerald-600 font-medium">offerts</span>
                )}
              </span>
              <span className="text-sm font-medium text-neutral-900 tabular-nums">
                {pricing.frais_port_ht === 0 ? '0,00' : pricing.frais_port_ht.toFixed(2)} €
              </span>
            </div>
            {pricing.restant_franco > 0 && (
              <div className="px-5 py-2 bg-amber-50">
                <p className="text-xs text-amber-700">
                  Plus que {pricing.restant_franco.toFixed(2)} € pour la livraison offerte
                </p>
              </div>
            )}
            <div className="flex justify-between px-5 py-3">
              <span className="text-sm text-neutral-500">TVA (20%)</span>
              <span className="text-sm font-medium text-neutral-900 tabular-nums">
                {pricing.tva.toFixed(2)} €
              </span>
            </div>
            <div className="flex justify-between px-5 py-4 bg-neutral-50 rounded-b-xl">
              <span className="text-base font-semibold text-neutral-900">Total TTC</span>
              <span className="text-xl font-bold text-neutral-900 tabular-nums">
                {pricing.total_ttc.toFixed(2)} €
              </span>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={async () => {
              const res = await fetch('/api/devis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ref: initialRef, qty }),
              });
              if (!res.ok) return;
              const data = await res.json();
              window.open(`/api/devis/pdf?token=${data.share_token}`, '_blank');
            }}
            className="w-full py-3 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 active:bg-neutral-950 transition-colors"
          >
            Générer mon devis PDF
          </button>
          <p className="text-xs text-neutral-400 text-center">
            Devis gratuit — validité 30 jours
          </p>
        </div>
      )}

      {loading && !pricing && (
        <div className="space-y-4 animate-pulse">
          <div className="h-32 bg-neutral-100 rounded-xl" />
          <div className="h-16 bg-neutral-100 rounded-xl" />
          <div className="h-48 bg-neutral-100 rounded-xl" />
        </div>
      )}
    </div>
  );
}
