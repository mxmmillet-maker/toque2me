import { getNormesRequises } from './normes';

export interface ScoringCriteria {
  typologies?: string[];     // pièces sélectionnées (catégories)
  secteur?: string;
  budget_global?: number;    // budget total HT
  nb_personnes?: number;     // effectif à équiper
  usage?: string;            // 'evenement' | 'quotidien' | 'image'
  priorites?: {
    durabilite: number;
    origine: number;
    rapidite: number;
  };
}

export interface ScoredProduct {
  id: string;
  nom: string;
  ref_fournisseur: string;
  categorie: string;
  description: string;
  image_url: string;
  grammage?: number;
  origine: string;
  certifications: string[];
  normes: string[];
  secteurs: string[];
  score_durabilite: number;
  score_premium: number;
  prix_vente_ht?: number;
  score: number;
}

const DEFAULT_PRIORITIES = {
  durabilite: 50,
  origine: 30,
  rapidite: 20,
};

export function scoreProducts(
  products: any[],
  criteria: ScoringCriteria,
  prixMap: Map<string, number>
): ScoredProduct[] {
  const normesRequises = criteria.secteur ? getNormesRequises(criteria.secteur) : [];
  const priorites = criteria.priorites || DEFAULT_PRIORITIES;

  // Budget par personne (pour filtrer les produits trop chers)
  const budgetParPersonne = (criteria.budget_global && criteria.nb_personnes)
    ? criteria.budget_global / criteria.nb_personnes
    : undefined;

  // Pondération qualité selon l'usage
  const usageWeights: Record<string, { durabilite: number; premium: number }> = {
    evenement: { durabilite: 0.1, premium: 0.2 },   // pas besoin de durer, budget serré
    quotidien: { durabilite: 0.4, premium: 0.2 },   // doit tenir dans le temps
    image: { durabilite: 0.3, premium: 0.5 },        // finitions et rendu importants
  };
  const weights = usageWeights[criteria.usage || 'quotidien'] || usageWeights.quotidien;

  const scored: ScoredProduct[] = [];

  for (const p of products) {
    let score = 0;

    // 1. Filtre par pièces sélectionnées
    if (criteria.typologies && criteria.typologies.length > 0) {
      const cat = (p.categorie || '').toLowerCase();
      const match = criteria.typologies.some((t) => cat.toLowerCase().includes(t.toLowerCase()));
      if (!match) continue;
    }

    // 2. Conformité normes — BONUS (pas éliminatoire tant que les données ne sont pas complètes)
    if (normesRequises.length > 0) {
      const productNormes = p.normes || [];
      const conforme = normesRequises.every((n) => productNormes.includes(n));
      if (conforme) score += 20;
    }

    // 3. Prix — élimine si une seule pièce dépasse le budget par personne
    const prixVente = prixMap.get(p.id);
    if (budgetParPersonne && prixVente && prixVente > budgetParPersonne) {
      continue;
    }

    // 4. Calcul du score

    // Durabilité (pondérée par usage)
    score += (p.score_durabilite || 50) * weights.durabilite;

    // Premium / finitions (pondérée par usage)
    score += (p.score_premium || 50) * weights.premium;

    // Bonus si le produit a un prix (chiffrable = actionnable)
    if (prixVente) score += 8;

    // Score prix — favorise les produits qui laissent de la marge
    // pour d'autres pièces dans le mix
    if (prixVente && budgetParPersonne) {
      const ratio = prixVente / budgetParPersonne;
      if (ratio < 0.5) score += 10;       // laisse beaucoup de marge pour un mix
      else if (ratio < 0.8) score += 5;   // correct
    }

    // Origine Europe
    const origine = (p.origine || '').toLowerCase();
    const isEurope = ['france', 'portugal', 'italie', 'espagne', 'allemagne', 'belgique'].some(
      (pays) => origine.includes(pays)
    );
    if (isEurope) score += 10 * (priorites.origine / 100);

    // Bonus secteur
    if (criteria.secteur && (p.secteurs || []).includes(criteria.secteur)) score += 8;

    // Bonus certifications
    if (p.certifications && p.certifications.length > 0) score += p.certifications.length * 3;

    scored.push({
      id: p.id,
      nom: p.nom,
      ref_fournisseur: p.ref_fournisseur,
      categorie: p.categorie || '',
      description: p.description || '',
      image_url: p.image_url || '',
      grammage: p.grammage,
      origine: p.origine || '',
      certifications: p.certifications || [],
      normes: p.normes || [],
      secteurs: p.secteurs || [],
      score_durabilite: p.score_durabilite || 50,
      score_premium: p.score_premium || 50,
      prix_vente_ht: prixVente,
      score,
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

export function getTop(products: ScoredProduct[], n: number): ScoredProduct[] {
  return products.slice(0, n);
}
