// ─── Normalisation des couleurs fournisseur → couleurs standard ──────────────
// Mappe les 1000+ noms TopTex/Cybernecard vers ~15 couleurs filtrables

export type StandardColor =
  | 'noir' | 'marine' | 'blanc' | 'gris' | 'beige'
  | 'rouge' | 'bordeaux' | 'orange' | 'jaune' | 'vert'
  | 'bleu' | 'violet' | 'rose' | 'marron' | 'multicolore';

interface ColorRule {
  keywords: string[];
  color: StandardColor;
}

// Ordre important — les règles sont testées dans l'ordre, première qui matche gagne
const RULES: ColorRule[] = [
  // Noir
  { keywords: ['black', 'noir', 'pitch', 'charcoal', 'carbon', 'anthracite', 'dark grey', 'dark heather', 'graphite'], color: 'noir' },

  // Blanc
  { keywords: ['white', 'blanc', 'snow', 'cream', 'crème', 'natural', 'ecru', 'ivory', 'off white', 'vanilla', 'oatmeal'], color: 'blanc' },

  // Marine
  { keywords: ['navy', 'marine', 'midnight', 'oxford navy', 'indigo', 'dark blue', 'deep blue', 'night navy', 'insignia blue'], color: 'marine' },

  // Bleu (hors marine)
  { keywords: ['royal blue', 'bright royal', 'cobalt', 'sky blue', 'sky', 'light blue', 'azure', 'aqua', 'turquoise', 'teal', 'ocean blue', 'atoll', 'pacific', 'carolina blue', 'hawaii blue', 'diva blue', 'sapphire', 'blue', 'bleu', 'ciel'], color: 'bleu' },

  // Bordeaux
  { keywords: ['bordeaux', 'burgundy', 'wine', 'maroon', 'cranberry', 'plum', 'deep red', 'cherry', 'crimson', 'marsala', 'dark cherry'], color: 'bordeaux' },

  // Rouge
  { keywords: ['red', 'rouge', 'scarlet', 'cardinal', 'fire red', 'bright red', 'classic red', 'hibiscus', 'coral', 'true red'], color: 'rouge' },

  // Orange
  { keywords: ['orange', 'tangerine', 'pumpkin', 'burnt orange', 'terracotta', 'rust', 'apricot', 'peach', 'sunset', 'neon orange'], color: 'orange' },

  // Jaune
  { keywords: ['yellow', 'jaune', 'gold', 'lemon', 'sunflower', 'mustard', 'cumin', 'solar', 'lime', 'fluorescent yellow', 'neon yellow', 'hi viz yellow', 'safety yellow'], color: 'jaune' },

  // Vert
  { keywords: ['green', 'vert', 'olive', 'khaki', 'kaki', 'forest', 'bottle', 'emerald', 'sage', 'moss', 'cypress', 'pistachio', 'mint', 'camo', 'military', 'ivy', 'pine', 'jungle', 'loden', 'spruce', 'evergreen', 'matcha', 'meadow', 'hemp'], color: 'vert' },

  // Rose
  { keywords: ['pink', 'rose', 'fuchsia', 'magenta', 'blush', 'candy', 'orchid', 'flamingo', 'dusty pink', 'pastel pink', 'lilac', 'lavender'], color: 'rose' },

  // Violet
  { keywords: ['purple', 'violet', 'plum violet', 'deep purple', 'radiant purple', 'iris'], color: 'violet' },

  // Marron
  { keywords: ['brown', 'marron', 'chocolate', 'camel', 'coffee', 'moka', 'espresso', 'cocoa', 'toffee', 'coyote', 'bear brown', 'dark amber'], color: 'marron' },

  // Beige
  { keywords: ['beige', 'sand', 'sable', 'stone', 'taupe', 'caramel', 'almond', 'nude', 'putty', 'biscuit', 'linen', 'peeble', 'wet sand', 'light sand', 'mastic', 'bone'], color: 'beige' },

  // Gris
  { keywords: ['grey', 'gray', 'gris', 'silver', 'ash', 'steel', 'zinc', 'slate', 'smoke', 'titanium', 'pewter', 'heather', 'cement', 'gravel', 'iron'], color: 'gris' },
];

/**
 * Normalise un nom de couleur fournisseur vers une couleur standard.
 * Ex: "Oxford Navy" → "marine", "Bottle Green" → "vert", "Dusty Pink" → "rose"
 */
export function normalizeColor(rawName: string): StandardColor | null {
  if (!rawName) return null;
  const lower = rawName.toLowerCase().trim();

  // Multicolore : si contient un "/" avec deux couleurs très différentes
  if (lower.includes('/') && lower.split('/').length >= 2) {
    const parts = lower.split('/').map(s => s.trim());
    const c1 = normalizeColorSimple(parts[0]);
    const c2 = normalizeColorSimple(parts[1]);
    if (c1 && c2 && c1 !== c2) return 'multicolore';
    if (c1) return c1;
    if (c2) return c2;
  }

  return normalizeColorSimple(lower);
}

function normalizeColorSimple(lower: string): StandardColor | null {
  for (const rule of RULES) {
    for (const kw of rule.keywords) {
      if (lower.includes(kw)) return rule.color;
    }
  }
  return null;
}

/**
 * Normalise toutes les couleurs d'un produit et retourne les couleurs standard uniques.
 */
export function normalizeProductColors(
  couleurs: { nom: string; hexa?: string; image?: string }[] | null | undefined
): StandardColor[] {
  if (!couleurs || couleurs.length === 0) return [];
  const standards = new Set<StandardColor>();
  for (const c of couleurs) {
    const norm = normalizeColor(c.nom);
    if (norm) standards.add(norm);
  }
  return Array.from(standards);
}

/**
 * Vérifie si un produit a une couleur qui matche les couleurs demandées par le client.
 * Map les couleurs du questionnaire vers les couleurs standard.
 */
const QUESTIONNAIRE_TO_STANDARD: Record<string, StandardColor[]> = {
  noir:       ['noir'],
  marine:     ['marine'],
  blanc:      ['blanc'],
  gris:       ['gris'],
  beige:      ['beige'],
  terracotta: ['orange', 'marron'], // terracotta est entre orange et marron
  bordeaux:   ['bordeaux'],
  vert_sapin: ['vert'],
  rouge:      ['rouge'],
  bleu_ciel:  ['bleu'],
  marque:     [], // couleurs de la marque = pas de filtre
};

export function productMatchesColors(
  productCouleurs: { nom: string }[] | null | undefined,
  wantedColors: string[] | undefined
): boolean {
  if (!wantedColors || wantedColors.length === 0 || wantedColors.includes('marque')) return true;
  if (!productCouleurs || productCouleurs.length === 0) return true; // pas de data = on ne filtre pas

  const productStandards = normalizeProductColors(productCouleurs as any);
  if (productStandards.length === 0) return true;

  // Au moins une couleur demandée doit matcher
  for (const wanted of wantedColors) {
    const targets = QUESTIONNAIRE_TO_STANDARD[wanted] || [];
    for (const target of targets) {
      if (productStandards.includes(target)) return true;
    }
  }
  return false;
}
