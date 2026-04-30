// ─── Taxonomie v2 — classification produit hiérarchique ─────────────────────
// Niveau 1 : catégorie
// Niveau 2 : sous-catégorie (type / longueur / zippé / …)
// Filtre transverse : genre (homme / femme / unisexe / enfant)

export interface ProductInput {
  ref_fournisseur?: string;
  nom: string;
  description?: string | null;
  categorie?: string | null;
  fournisseur?: string | null;
  genre?: string | null;
  composition?: string | null;
  marque?: string | null;
}

export type CategorieV2 =
  | 'Accessoires'
  | 'Chaussures'
  | 'Chemises'
  | 'EPI'
  | 'Objets promo'
  | 'Pantalons'
  | 'Polos'
  | 'Softshell'
  | 'Sport'
  | 'Sweats'
  | 'T-shirts'
  | 'Vestes';

export type Genre = 'homme' | 'femme' | 'unisexe' | 'enfant';

export interface TaxonomyResult {
  categorie: CategorieV2 | null;
  sous_categorie: string | null;
  genre: Genre | null;
  candidats: CategorieV2[];       // plusieurs catégories ont matché
  ambiguites: string[];            // codes de problème
}

// ─── Mots-clés par catégorie ────────────────────────────────────────────────
// IMPORTANT : la détection de la catégorie principale se fait sur le NOM du produit
// uniquement (pas la description) pour éviter les faux positifs genre
// "ceinture élastique" d'un pantalon qui matcherait "Accessoires".

interface Rule {
  cat: CategorieV2;
  priority: number; // plus élevé = gagne en cas de conflit
  match: (nom: string, desc: string, p: ProductInput) => boolean;
}

function has(hay: string, words: string[]): boolean {
  return words.some(w => hay.includes(w));
}

function composition100Poly(p: ProductInput): boolean {
  const c = `${p.composition || ''} ${p.description || ''}`.toLowerCase();
  if (/100\s*%\s*poly/.test(c)) return true;
  const m = c.match(/(\d+)\s*%\s*poly/);
  return !!(m && parseInt(m[1]) >= 95);
}

const RULES: Rule[] = [
  // ── Priorité haute : types spécifiques qui doivent prévaloir ──
  { cat: 'Softshell', priority: 100, match: (n) => has(n, ['softshell']) },

  { cat: 'Sport', priority: 95, match: (n, _d, p) =>
    (has(n, ['maillot']) && composition100Poly(p))
    || has(n, ['survêtement', 'jogging sport', 'short running', 'tenue foot', 'dry fit', 'brassière'])
  },

  { cat: 'Chaussures', priority: 90, match: (n) =>
    has(n, ['chaussure', 'sabot', 'basket', 'baskets', 'safety shoe', 'safety boot', 'brodequin', 'mocassin', 'bottes sécurité', 'botte sécurité', 'bottes de sécurité', 'botte de sécurité'])
  },

  { cat: 'EPI', priority: 85, match: (n) =>
    has(n, ['gilet haute visibilité', 'gilet hv', 'gilet fluo', 'casque chantier', 'casque de sécurité', 'gant protection', 'gant travail', 'harnais', 'antichute'])
  },

  { cat: 'Objets promo', priority: 80, match: (n) =>
    has(n, ['peluche', 'stylo', 'tote bag', 'gourde', 'thermos', 'parapluie', 'porte-clé', 'porte-clef', 'clé usb', 'power bank', 'carnet', 'bloc-notes', 'squeezie', 'anti-stress', 'antistress', 'canard', 'conférencier', 'porte-document', 'porte-documents', 'goodie', 'figurine', 'magnet', 'tapis souris', 'badge'])
    || /\bmug\b/.test(n)
    || /\busb\b/.test(n)
    || /\bmbw\b/.test(n)
  },

  // ── Types textile (priorité medium) — match sur le nom ──
  // Sweats d'abord (priorité plus haute) pour que "sweat-shirt" ne soit pas
  // attrapé par la règle T-shirts qui matcherait la substring "t-shirt".
  { cat: 'Sweats', priority: 75, match: (n) =>
    /(?:^|[^a-z])sweat/.test(n)
    || /\bhoodie\b/.test(n)
    || /\bpull(?:-?over)?\b/.test(n)
  },

  { cat: 'T-shirts', priority: 70, match: (n) =>
    /(?:^|[^a-z])t[- ]?shirts?\b/.test(n)
    || /(?:^|[^a-z])tee[- ]?shirts?\b/.test(n)
    || /\bdébardeur\b/.test(n)
    || /\btank[- ]?top\b/.test(n)
    || /\bmarinière\b/.test(n)
  },

  { cat: 'Polos', priority: 70, match: (n) => /\bpolos?\b/.test(n) },

  { cat: 'Chemises', priority: 70, match: (n) =>
    /\bchemise\b/.test(n) || /\bchemisier\b/.test(n) || /\boxford\b/.test(n) || /\bblouse\b/.test(n)
  },

  { cat: 'Vestes', priority: 60, match: (n) =>
    has(n, ['veste', 'blouson', 'parka', 'doudoune', 'bodywarmer', 'body warmer', 'coupe-vent', 'coupe vent', 'imperméable', 'anorak', 'polaire'])
    || (/\bimper\b/.test(n))
    || (has(n, ['gilet']) && !has(n, ['gilet haute visibilité', 'gilet hv', 'gilet fluo']))
  },

  { cat: 'Pantalons', priority: 60, match: (n) =>
    has(n, ['pantalon', 'chino', 'jeans', 'jogging', 'cargo', 'bermuda', 'short', 'jupe'])
    || /\bjean\b/.test(n)
  },

  { cat: 'Accessoires', priority: 50, match: (n) =>
    has(n, ['casquette', 'bonnet', 'chapeau', 'écharpe', 'foulard', 'chèche', 'tour de cou', 'sacoche', 'bagagerie', 'cravate', 'pochette', 'pochon', 'ceinture'])
    || /\bbob\b/.test(n)
    || /\bsac\b/.test(n)
    || /\btote\b/.test(n)
  },
];

// ─── Sous-catégorisation ─────────────────────────────────────────────────────

function sousCategorie(cat: CategorieV2, hay: string, p: ProductInput): string | null {
  switch (cat) {
    case 'T-shirts':
      if (has(hay, ['débardeur', 'tank top'])) return 'débardeurs';
      if (has(hay, ['manche longue', 'manches longues', 'long sleeve', 'longsleeve'])) return 'manches longues';
      if (has(hay, ['manche courte', 'manches courtes', 'short sleeve', ' mc ', ' m/c '])) return 'manches courtes';
      return null; // ambigu

    case 'Polos':
      if (has(hay, ['manche longue', 'manches longues', 'long sleeve'])) return 'manches longues';
      if (has(hay, ['manche courte', 'manches courtes', 'short sleeve'])) return 'manches courtes';
      return 'manches courtes'; // défaut raisonnable pour polo

    case 'Chemises':
      if (has(hay, ['manche longue', 'manches longues', 'long sleeve'])) return 'manches longues';
      if (has(hay, ['manche courte', 'manches courtes', 'short sleeve'])) return 'manches courtes';
      return null;

    case 'Sweats': {
      const forme = has(hay, ['capuche', 'hoodie', 'hood ']) ? 'capuche' : (has(hay, ['col rond', 'col-rond', 'crewneck', 'crew neck']) ? 'col rond' : null);
      let zip: string | null = null;
      if (has(hay, ['full zip', 'full-zip', 'entièrement zippé'])) zip = 'full zip';
      else if (has(hay, ['quart de zip', 'quart zip', 'quarter zip', '1/4 zip', 'quarter-zip'])) zip = 'quart de zip';
      else if (has(hay, ['zippé', 'zipped', 'zip '])) zip = 'zippé';
      else zip = 'sans zip';
      if (!forme) return null; // ambigu sur la forme
      return zip ? `${forme} / ${zip}` : forme;
    }

    case 'Vestes':
      if (has(hay, ['doudoune', 'down jacket'])) return 'doudoune';
      if (has(hay, ['bodywarmer', 'body warmer', 'gilet matelassé', 'gilet sans manche'])) return 'bodywarmer';
      if (has(hay, ['parka'])) return 'parka';
      if (has(hay, ['coupe-vent', 'coupe vent', 'windbreaker', 'k-way'])) return 'coupe-vent';
      if (has(hay, ['imperméable', 'imper ', 'pluie', 'rainwear', 'waterproof'])) return 'imperméable';
      if (has(hay, ['en iso 20471', 'haute visibilité', 'hv ', 'fluo'])) return 'EPI';
      if (has(hay, ['interlock', 'molleton', 'training', 'veste sport'])) return 'sport';
      if (has(hay, ['veste', 'blouson', 'gilet', 'polaire'])) return 'tissu';
      return null;

    case 'Pantalons':
      if (has(hay, ['jeans', 'jean '])) return 'jeans';
      if (has(hay, ['chino'])) return 'chino';
      if (has(hay, ['jogging', 'jog ', 'sweatpant'])) return 'jogging';
      if (has(hay, ['cargo', 'multipoche', 'en iso 20471', 'hv ', 'fluo', 'chantier', 'workwear'])) return 'EPI';
      if (has(hay, ['bermuda', 'short'])) return 'shorts-bermudas';
      if (has(hay, ['pantalon'])) return 'pantalon';
      return null;

    case 'Chaussures':
      if (has(hay, ['sécurité', 'safety', 's1', 's2', 's3', 'sb ', 'iso 20345', 'brodequin', 'botte sécurité', 'bottes sécurité'])) return 'sécurité';
      if (has(hay, ['running', 'basket', 'sport', 'sneaker', 'training'])) return 'sport';
      if (has(hay, ['mocassin', 'ville', 'cuir'])) return 'ville';
      if (has(hay, ['sabot'])) return 'sabot';
      return null;

    case 'Sport':
      if (has(hay, ['maillot'])) return 'maillots';
      if (has(hay, ['short'])) return 'shorts';
      if (has(hay, ['survêtement', 'jogging'])) return 'survêtements';
      return null;

    case 'Accessoires':
      if (has(hay, ['casquette'])) return 'casquettes';
      if (has(hay, ['bonnet'])) return 'bonnets';
      if (has(hay, ['chapeau', 'bob'])) return 'chapeaux';
      if (has(hay, ['écharpe', 'foulard', 'chèche', 'tour de cou'])) return 'cols/écharpes';
      if (has(hay, ['sac', 'sacoche', 'tote', 'bagagerie'])) return 'sacs';
      if (has(hay, ['cravate'])) return 'cravates';
      if (has(hay, ['ceinture'])) return 'ceintures';
      return null;

    case 'EPI':
      if (has(hay, ['gilet', 'en iso 20471'])) return 'gilets HV';
      if (has(hay, ['casque'])) return 'casques';
      if (has(hay, ['gant'])) return 'gants';
      if (has(hay, ['chaussure', 'bottes', 'brodequin'])) return 'chaussures sécu';
      if (has(hay, ['harnais', 'antichute'])) return 'antichute';
      return null;

    case 'Softshell':
      return null; // softshell = catégorie à part, pas de sous-cat obligatoire

    case 'Objets promo':
      if (has(hay, ['peluche'])) return 'peluches';
      if (has(hay, ['mug'])) return 'mugs';
      if (has(hay, ['stylo'])) return 'stylos';
      if (has(hay, ['tote'])) return 'tote bags';
      if (has(hay, ['parapluie'])) return 'parapluies';
      if (has(hay, ['gourde', 'thermos'])) return 'gourdes';
      if (has(hay, ['clé usb', 'usb'])) return 'USB';
      if (has(hay, ['carnet', 'bloc-notes'])) return 'carnets';
      return 'autres';
  }
  return null;
}

// ─── Fallback catégorie actuelle → nouvelle taxo ────────────────────────────
// Quand aucune règle ne matche, on mappe l'ancienne catégorie vers la nouvelle
// taxo. Évite de laisser des centaines de produits en "non détecté" alors que
// leur catégorie actuelle est parlante.

function fallbackFromCurrent(cur: string | null | undefined): CategorieV2 | null {
  if (!cur) return null;
  const c = cur.toLowerCase().trim();
  if (['goodies', 'parapluies', 'objets tech'].includes(c)) return 'Objets promo';
  if (['bagagerie'].includes(c)) return 'Accessoires';
  if (['bonnets', 'casquettes', 'chapeaux'].includes(c)) return 'Accessoires';
  return null;
}

// ─── Détection genre ─────────────────────────────────────────────────────────

function detectGenre(p: ProductInput, nom: string, isTextile: boolean): Genre | null {
  if (p.genre) {
    const g = p.genre.toLowerCase().trim();
    if (['homme', 'men', 'male', 'h'].includes(g)) return 'homme';
    if (['femme', 'women', 'lady', 'ladies', 'female', 'f'].includes(g)) return 'femme';
    if (['unisexe', 'unisex', 'mixte', 'u'].includes(g)) return 'unisexe';
    if (['enfant', 'kids', 'junior', 'child', 'e'].includes(g)) return 'enfant';
  }

  // sur nom uniquement (la description introduit trop de bruit)
  if (/\b(enfant|kids|junior|child|children|bébé|baby|fille|garçon|fillette|garçonnet|boy|girl)\b/.test(nom)) return 'enfant';
  if (/\b(femme|ladies|lady|womens?|woman)\b/.test(nom)) return 'femme';
  if (/\b(homme|mens?|masculin)\b/.test(nom)) return 'homme';
  if (/\b(unisexe|unisex|mixte)\b/.test(nom)) return 'unisexe';

  // Défaut : accessoire/objet/chaussure = unisexe ; textile sans indice = null (ambigu)
  if (!isTextile) return 'unisexe';
  return null;
}

// ─── Moteur principal ───────────────────────────────────────────────────────

export function classifyProduct(p: ProductInput): TaxonomyResult {
  const nom = (p.nom || '').toLowerCase();
  const desc = (p.description || '').toLowerCase();
  const hayFull = `${nom} ${desc} ${(p.categorie || '').toLowerCase()}`;
  const ambiguites: string[] = [];

  // 1. Matcher toutes les règles qui passent (sur le nom)
  const matched = RULES.filter(r => r.match(nom, desc, p));

  // 2. Trier par priorité décroissante
  matched.sort((a, b) => b.priority - a.priority);

  const candidats = Array.from(new Set(matched.map(m => m.cat)));
  let cat: CategorieV2 | null = matched[0]?.cat ?? null;

  // Fallback : si aucune règle ne match, hériter de la catégorie actuelle
  // quand le mapping est évident (migrations de nommage connues).
  if (!cat) {
    const fallback = fallbackFromCurrent(p.categorie);
    if (fallback) {
      cat = fallback;
      ambiguites.push('heritage_categorie_actuelle');
    } else {
      ambiguites.push('categorie_non_detectee');
    }
  } else if (matched.length > 1) {
    const diffCats = new Set(matched.map(m => m.cat));
    if (diffCats.size > 1 && (matched[0].priority - matched[1].priority) <= 10) {
      ambiguites.push(`conflit_categorie: ${Array.from(diffCats).join('+')}`);
    }
  }

  // 3. Sous-catégorie (peut utiliser la description)
  let sousCat: string | null = null;
  if (cat) {
    sousCat = sousCategorie(cat, hayFull, p);
    if (!sousCat) ambiguites.push('sous_categorie_non_detectee');
  }

  // 4. Genre
  const textileCats: CategorieV2[] = ['T-shirts', 'Polos', 'Sweats', 'Chemises', 'Vestes', 'Pantalons', 'Softshell', 'Sport'];
  const isTextile = cat ? textileCats.includes(cat) : false;
  const genre = detectGenre(p, nom, isTextile);
  if (!genre) ambiguites.push('genre_non_detecte');

  // 5. Cas spéciaux
  if (has(nom, ['maillot']) && cat !== 'Sport' && !composition100Poly(p)) {
    ambiguites.push('maillot_pas_100_polyester');
  }
  if ((p.categorie || '').toLowerCase() === 'autres') {
    ambiguites.push('categorie_actuelle_autres');
  }
  if (cat === 'Vestes' && !sousCat) {
    ambiguites.push('veste_type_non_detecte');
  }

  return {
    categorie: cat,
    sous_categorie: sousCat,
    genre,
    candidats,
    ambiguites,
  };
}
