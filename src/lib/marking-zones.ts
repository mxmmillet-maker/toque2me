// ─── Configuration statique des zones de marquage par categorie produit ─────
// Positions en % de l'image produit, pour overlay SVG

export interface MarkingZone {
  id: string;
  label: string;
  face: 'front' | 'back';
  /** % depuis la gauche */
  x: number;
  /** % depuis le haut */
  y: number;
  /** % largeur */
  w: number;
  /** % hauteur */
  h: number;
  /** Largeur par defaut du marquage en cm */
  defaultLargeurCm: number;
  /** Position dans la grille tarifaire (coeur, dos, manche) */
  pricingPosition: string;
}

// ─── Zones communes ────────────────────────────────────────────────────────

const ZONE_COEUR: MarkingZone = {
  id: 'coeur',
  label: 'Coeur',
  face: 'front',
  x: 52,
  y: 28,
  w: 20,
  h: 14,
  defaultLargeurCm: 7,
  pricingPosition: 'coeur',
};

const ZONE_DOS: MarkingZone = {
  id: 'dos',
  label: 'Dos complet',
  face: 'back',
  x: 30,
  y: 22,
  w: 40,
  h: 30,
  defaultLargeurCm: 25,
  pricingPosition: 'dos',
};

const ZONE_MANCHE_GAUCHE: MarkingZone = {
  id: 'manche_gauche',
  label: 'Manche gauche',
  face: 'front',
  x: 10,
  y: 26,
  w: 16,
  h: 10,
  defaultLargeurCm: 5,
  pricingPosition: 'manche',
};

const ZONE_MANCHE_DROITE: MarkingZone = {
  id: 'manche_droite',
  label: 'Manche droite',
  face: 'front',
  x: 74,
  y: 26,
  w: 16,
  h: 10,
  defaultLargeurCm: 5,
  pricingPosition: 'manche',
};

const ZONE_CUISSE: MarkingZone = {
  id: 'cuisse',
  label: 'Cuisse',
  face: 'front',
  x: 35,
  y: 20,
  w: 18,
  h: 12,
  defaultLargeurCm: 7,
  pricingPosition: 'coeur',
};

const ZONE_CENTRE: MarkingZone = {
  id: 'centre',
  label: 'Centre',
  face: 'front',
  x: 30,
  y: 25,
  w: 40,
  h: 30,
  defaultLargeurCm: 20,
  pricingPosition: 'dos',
};

const ZONE_FACE: MarkingZone = {
  id: 'face',
  label: 'Face',
  face: 'front',
  x: 25,
  y: 20,
  w: 50,
  h: 35,
  defaultLargeurCm: 7,
  pricingPosition: 'coeur',
};

// ─── Zones par categorie ───────────────────────────────────────────────────

const ZONES_TSHIRT: MarkingZone[] = [ZONE_COEUR, ZONE_DOS, ZONE_MANCHE_GAUCHE, ZONE_MANCHE_DROITE];

export const ZONES_BY_CATEGORY: Record<string, MarkingZone[]> = {
  't-shirts': ZONES_TSHIRT,
  'tshirts': ZONES_TSHIRT,
  't-shirt': ZONES_TSHIRT,
  'polos': ZONES_TSHIRT,
  'polo': ZONES_TSHIRT,
  'sweats': ZONES_TSHIRT,
  'sweat': ZONES_TSHIRT,
  'sweatshirts': ZONES_TSHIRT,
  'vestes': [ZONE_COEUR, ZONE_DOS, ZONE_MANCHE_GAUCHE],
  'veste': [ZONE_COEUR, ZONE_DOS, ZONE_MANCHE_GAUCHE],
  'softshell': [ZONE_COEUR, ZONE_DOS, ZONE_MANCHE_GAUCHE],
  'polaires': [ZONE_COEUR, ZONE_DOS, ZONE_MANCHE_GAUCHE],
  'chemises': [ZONE_COEUR, ZONE_DOS],
  'chemise': [ZONE_COEUR, ZONE_DOS],
  'pantalons': [ZONE_CUISSE],
  'pantalon': [ZONE_CUISSE],
  'tabliers': [ZONE_CENTRE],
  'tablier': [ZONE_CENTRE],
  'casquettes': [ZONE_FACE],
  'casquette': [ZONE_FACE],
  'accessoires': [ZONE_FACE],
  'bonnets': [ZONE_FACE],
  'bonnet': [ZONE_FACE],
};

/** Retourne les zones de marquage pour une categorie (fallback: coeur + dos) */
export function getZonesForCategory(categorie: string): MarkingZone[] {
  const key = categorie.toLowerCase().trim();
  return ZONES_BY_CATEGORY[key] ?? [ZONE_COEUR, ZONE_DOS];
}

/** Toutes les techniques supportees */
export const TECHNIQUES = [
  { id: 'broderie', label: 'Broderie' },
  { id: 'serigraphie', label: 'Serigraphie' },
  { id: 'dtf', label: 'DTF' },
] as const;

export type TechniqueId = (typeof TECHNIQUES)[number]['id'];
