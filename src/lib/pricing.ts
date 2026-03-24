import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Margin {
  coefficient: number;
  franco_port_ht: number;
  frais_port_ht: number;
}

interface PriceTier {
  qte_min: number;
  qte_max: number | null;
  prix_achat_ht: number;
  prix_vente_ht: number;
}

// Récupérer le coefficient applicable (le plus spécifique gagne)
export async function getMargin(fournisseur: string, categorie?: string): Promise<Margin> {
  const { data } = await supabase
    .from('margins')
    .select('coefficient, franco_port_ht, frais_port_ht, fournisseur, categorie')
    .or(`and(fournisseur.eq.${fournisseur},categorie.eq.${categorie}),and(fournisseur.eq.${fournisseur},categorie.is.null),and(fournisseur.is.null,categorie.is.null)`)
    .order('fournisseur', { ascending: false, nullsFirst: false })
    .order('categorie', { ascending: false, nullsFirst: false })
    .limit(1);

  if (data && data.length > 0) {
    return {
      coefficient: Number(data[0].coefficient),
      franco_port_ht: Number(data[0].franco_port_ht),
      frais_port_ht: Number(data[0].frais_port_ht),
    };
  }

  // Fallback par défaut
  return { coefficient: 1.3, franco_port_ht: 150, frais_port_ht: 12.5 };
}

// Récupérer les paliers de prix de VENTE pour un produit
export async function getPriceTiers(productId: string, fournisseur: string, categorie?: string): Promise<PriceTier[]> {
  const [pricesResult, margin] = await Promise.all([
    supabase
      .from('prices')
      .select('qte_min, qte_max, prix_ht')
      .eq('product_id', productId)
      .order('qte_min', { ascending: true }),
    getMargin(fournisseur, categorie),
  ]);

  const prices = pricesResult.data ?? [];

  return prices.map((p) => ({
    qte_min: p.qte_min,
    qte_max: p.qte_max,
    prix_achat_ht: Number(p.prix_ht),
    prix_vente_ht: Math.ceil(Number(p.prix_ht) * margin.coefficient * 100) / 100,
  }));
}

// Prix de vente unitaire pour une quantité donnée
export function getPrixVenteForQty(tiers: PriceTier[], qty: number): number | null {
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (qty >= tiers[i].qte_min) return tiers[i].prix_vente_ht;
  }
  return tiers.length > 0 ? tiers[0].prix_vente_ht : null;
}
