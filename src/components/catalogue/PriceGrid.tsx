interface PriceTier {
  qte_min: number;
  qte_max: number | null;
  prix_vente_ht: number;
}

interface PriceGridProps {
  tiers: PriceTier[];
}

export function PriceGrid({ tiers }: PriceGridProps) {
  if (tiers.length === 0) return null;

  return (
    <div>
      <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">
        Grille tarifaire
      </h2>
      <div className="grid grid-cols-5 gap-px bg-neutral-100 rounded-lg overflow-hidden">
        {tiers.map((tier, i) => (
          <div key={i} className="bg-white p-3 text-center">
            <div className="text-[11px] text-neutral-400 mb-1">
              {tier.qte_max ? `${tier.qte_min}–${tier.qte_max}` : `${tier.qte_min}+`}
            </div>
            <div className="text-sm font-semibold text-neutral-900">
              {tier.prix_vente_ht.toFixed(2)}&nbsp;€
            </div>
            <div className="text-[10px] text-neutral-400">HT/pièce</div>
          </div>
        ))}
      </div>
    </div>
  );
}
