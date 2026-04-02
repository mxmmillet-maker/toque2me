// ─── Configuration marquage — simplifiée ────────────────────────────────────
// Pas de SVG overlay, juste des positions de marquage avec tarifs

export interface MarkingZone {
  id: string;
  label: string;
  defaultLargeurCm: number;
  pricingPosition: string; // correspond à marking_pricing.position
}

const ZONE_COEUR: MarkingZone = {
  id: 'coeur',
  label: 'Poitrine (coeur)',
  defaultLargeurCm: 7,
  pricingPosition: 'coeur',
};

const ZONE_DOS: MarkingZone = {
  id: 'dos',
  label: 'Dos',
  defaultLargeurCm: 25,
  pricingPosition: 'dos',
};

const ZONE_CENTRE: MarkingZone = {
  id: 'centre',
  label: 'Centre',
  defaultLargeurCm: 20,
  pricingPosition: 'dos', // même grille tarifaire que dos
};

const ZONE_FACE: MarkingZone = {
  id: 'face',
  label: 'Face avant',
  defaultLargeurCm: 7,
  pricingPosition: 'coeur',
};

// Zones par catégorie — coeur + dos pour le textile, centre pour tabliers, face pour casquettes
const ZONES_TEXTILE: MarkingZone[] = [ZONE_COEUR, ZONE_DOS];

export const ZONES_BY_CATEGORY: Record<string, MarkingZone[]> = {
  't-shirts': ZONES_TEXTILE,
  'polos': ZONES_TEXTILE,
  'sweats': ZONES_TEXTILE,
  'vestes': ZONES_TEXTILE,
  'chemises': ZONES_TEXTILE,
  'pantalons': [ZONE_COEUR], // cuisse = même grille que coeur
  'tabliers': [ZONE_CENTRE],
  'casquettes': [ZONE_FACE],
  'accessoires': [ZONE_FACE],
};

export function getZonesForCategory(categorie: string): MarkingZone[] {
  const key = categorie.toLowerCase().trim();
  return ZONES_BY_CATEGORY[key] ?? ZONES_TEXTILE;
}

export const TECHNIQUES = [
  { id: 'broderie', label: 'Broderie', sub: 'Premium, durable' },
  { id: 'serigraphie', label: 'Sérigraphie', sub: 'Gros volumes, min. 25 pces' },
  { id: 'dtf', label: 'DTF / Transfert', sub: 'Photo, dégradés, petites séries' },
] as const;

export type TechniqueId = (typeof TECHNIQUES)[number]['id'];
