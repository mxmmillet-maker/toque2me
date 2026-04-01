// ─── Moteur de tagging par héritage ───────────────────────────────────────────
// Arbre descendant : Catégorie → Type → Matière → Grammage
// Les tags se propagent vers le bas, les overrides sont possibles par produit

interface ProductData {
  nom: string;
  description: string;
  categorie: string;
  grammage?: number;
  prix_vente_ht?: number;
  certifications: string[];
  normes: string[];
}

export interface ProductTags {
  // Taxonomie
  famille: 'textile_haut' | 'textile_bas' | 'accessoire' | 'chaussure' | 'objet';
  type: string;           // polo, t-shirt, sweat, veste, pantalon, tablier...
  matiere: string;        // coton, polyester, mix, lin, technique
  gamme_grammage: 'leger' | 'medium' | 'lourd';

  // Tags contextuels (hérités des règles)
  usages: string[];       // quotidien, evenement, cuisine, chantier, bureau
  saison: string[];       // ete, hiver, toute_saison, mi_saison
  techniques_marquage: string[];  // broderie, serigraphie, dtf, sublimation
  niveau_gamme: 'entree' | 'milieu' | 'premium';
  lavage_max: number;     // 30, 40, 60, 95
  style: string[];        // casual, chic, sportswear, workwear
  public_cible: string[]; // restauration, btp, corporate, associatif, hotellerie
}

// ─── Détection taxonomie ─────────────────────────────────────────────────────

function detectFamille(categorie: string): ProductTags['famille'] {
  const cat = categorie.toLowerCase();
  if (['t-shirts', 'polos', 'sweats', 'vestes', 'chemises', 'chef'].some(c => cat.includes(c.toLowerCase()))) return 'textile_haut';
  if (['pantalons'].some(c => cat.includes(c.toLowerCase()))) return 'textile_bas';
  if (['tabliers'].includes(cat.toLowerCase())) return 'textile_haut'; // tablier = haut
  if (['accessoires', 'bagagerie', 'parapluies'].some(c => cat.includes(c.toLowerCase()))) return 'accessoire';
  if (cat.includes('chaussure') || cat.includes('sabot')) return 'chaussure';
  if (['goodies', 'objets tech'].some(c => cat.includes(c.toLowerCase()))) return 'objet';
  return 'accessoire';
}

function detectType(nom: string, categorie: string): string {
  const lower = `${nom} ${categorie}`.toLowerCase();
  if (lower.includes('polo')) return 'polo';
  if (lower.includes('t-shirt') || lower.includes('tee-shirt')) return 't-shirt';
  if (lower.includes('débardeur') || lower.includes('tank')) return 'debardeur';
  if (lower.includes('sweat') && lower.includes('zip')) return 'sweat_zippe';
  if (lower.includes('sweat') || lower.includes('hoodie')) return 'sweat';
  if (lower.includes('veste') && (lower.includes('cuisine') || lower.includes('chef'))) return 'veste_cuisine';
  if (lower.includes('softshell')) return 'softshell';
  if (lower.includes('parka') || lower.includes('manteau')) return 'parka';
  if (lower.includes('veste') || lower.includes('jacket') || lower.includes('blouson')) return 'veste';
  if (lower.includes('chemise') || lower.includes('oxford')) return 'chemise';
  if (lower.includes('pantalon') && lower.includes('cuisine')) return 'pantalon_cuisine';
  if (lower.includes('pantalon') || lower.includes('chino')) return 'pantalon';
  if (lower.includes('bermuda') || lower.includes('short')) return 'bermuda';
  if (lower.includes('tablier')) return 'tablier';
  if (lower.includes('casquette')) return 'casquette';
  if (lower.includes('bonnet')) return 'bonnet';
  if (lower.includes('chapeau') || lower.includes('bob')) return 'chapeau';
  if (lower.includes('écharpe') || lower.includes('foulard')) return 'echarpe';
  if (lower.includes('sac') || lower.includes('tote')) return 'sac';
  if (lower.includes('parapluie')) return 'parapluie';
  if (lower.includes('sabot') || lower.includes('chaussure')) return 'chaussure';
  if (lower.includes('gourde') || lower.includes('thermos')) return 'gourde';
  return 'autre';
}

function detectMatiere(description: string): string {
  const lower = description.toLowerCase();

  // Matières techniques
  if (lower.includes('softshell') || lower.includes('membrane')) return 'technique';
  if (lower.includes('polyamide') || lower.includes('nylon')) return 'technique';

  // Extraction composition
  const cotonMatch = lower.match(/(\d+)\s*%\s*coton/);
  const polyMatch = lower.match(/(\d+)\s*%\s*poly/);
  const linMatch = lower.match(/(\d+)\s*%\s*lin/);

  const cotonPct = cotonMatch ? parseInt(cotonMatch[1]) : 0;
  const polyPct = polyMatch ? parseInt(polyMatch[1]) : 0;

  if (linMatch) return 'lin';
  if (cotonPct >= 80) return 'coton';
  if (polyPct >= 80) return 'polyester';
  if (cotonPct > 0 && polyPct > 0) return 'mix';
  if (lower.includes('coton')) return 'coton';
  if (lower.includes('polyester') || lower.includes('polaire')) return 'polyester';

  return 'mix';
}

// Seuils grammage par type de produit (g/m²)
const GRAMMAGE_SEUILS: Record<string, { leger: number; lourd: number }> = {
  't-shirt':         { leger: 140, lourd: 190 },
  'debardeur':       { leger: 120, lourd: 170 },
  'polo':            { leger: 170, lourd: 230 },
  'chemise':         { leger: 100, lourd: 140 },
  'sweat':           { leger: 250, lourd: 320 },
  'sweat_zippe':     { leger: 250, lourd: 320 },
  'veste':           { leger: 200, lourd: 300 },
  'veste_cuisine':   { leger: 150, lourd: 220 },
  'softshell':       { leger: 280, lourd: 350 },
  'parka':           { leger: 200, lourd: 300 },
  'pantalon':        { leger: 200, lourd: 300 },
  'pantalon_cuisine':{ leger: 180, lourd: 250 },
  'bermuda':         { leger: 180, lourd: 260 },
  'tablier':         { leger: 150, lourd: 250 },
};

function detectGammeGrammage(grammage: number | undefined, type?: string): ProductTags['gamme_grammage'] {
  if (!grammage) return 'medium';
  const seuils = GRAMMAGE_SEUILS[type || ''] || { leger: 150, lourd: 250 };
  if (grammage < seuils.leger) return 'leger';
  if (grammage > seuils.lourd) return 'lourd';
  return 'medium';
}

// ─── Règles de tagging par héritage ──────────────────────────────────────────

interface TagRule {
  condition: (p: ProductData, taxo: { famille: string; type: string; matiere: string; gamme: string }) => boolean;
  tags: Partial<ProductTags>;
}

const RULES: TagRule[] = [
  // ── Par famille ──
  { condition: (_, t) => t.famille === 'textile_haut', tags: { techniques_marquage: ['broderie', 'serigraphie', 'dtf'] } },
  { condition: (_, t) => t.famille === 'textile_bas', tags: { techniques_marquage: ['broderie', 'serigraphie'] } },
  { condition: (_, t) => t.famille === 'accessoire', tags: { techniques_marquage: ['broderie', 'serigraphie'] } },
  { condition: (_, t) => t.famille === 'objet', tags: { techniques_marquage: ['gravure', 'tampographie', 'sublimation'] } },

  // ── Par matière ──
  { condition: (_, t) => t.matiere === 'coton', tags: { lavage_max: 60, saison: ['toute_saison'] } },
  { condition: (_, t) => t.matiere === 'polyester', tags: { lavage_max: 40, saison: ['toute_saison'], techniques_marquage: ['sublimation', 'dtf', 'serigraphie'] } },
  { condition: (_, t) => t.matiere === 'mix', tags: { lavage_max: 40, saison: ['toute_saison'] } },
  { condition: (_, t) => t.matiere === 'lin', tags: { lavage_max: 40, saison: ['ete'], style: ['chic'] } },
  { condition: (_, t) => t.matiere === 'technique', tags: { lavage_max: 30, saison: ['mi_saison', 'hiver'], style: ['sportswear'] } },

  // ── Par grammage ──
  { condition: (_, t) => t.gamme === 'leger', tags: { saison: ['ete'], usages: ['evenement'] } },
  { condition: (_, t) => t.gamme === 'lourd', tags: { saison: ['hiver', 'mi_saison'], usages: ['quotidien'], niveau_gamme: 'premium' } },

  // ── Par type + matière ──
  { condition: (_, t) => t.type === 'polo' && t.matiere === 'coton' && t.gamme !== 'leger', tags: { style: ['chic', 'casual'], usages: ['bureau', 'quotidien'], public_cible: ['corporate', 'hotellerie'] } },
  { condition: (_, t) => t.type === 'polo' && t.gamme === 'leger', tags: { style: ['casual', 'sportswear'], usages: ['evenement'] } },
  { condition: (_, t) => t.type === 't-shirt', tags: { style: ['casual'], usages: ['evenement', 'quotidien'] } },
  { condition: (_, t) => t.type === 'chemise', tags: { style: ['chic', 'classique'], public_cible: ['corporate', 'hotellerie'] } },
  { condition: (_, t) => t.type === 'sweat' || t.type === 'sweat_zippe', tags: { style: ['casual'], usages: ['quotidien'], saison: ['hiver', 'mi_saison'] } },
  { condition: (_, t) => t.type === 'softshell', tags: { style: ['sportswear', 'workwear'], usages: ['chantier', 'quotidien'], public_cible: ['btp'] } },
  { condition: (_, t) => t.type === 'parka', tags: { style: ['workwear'], usages: ['chantier'], saison: ['hiver'], public_cible: ['btp'] } },
  { condition: (_, t) => t.type === 'tablier', tags: { usages: ['cuisine', 'quotidien'], public_cible: ['restauration'], lavage_max: 60 } },
  { condition: (_, t) => t.type === 'veste_cuisine', tags: { usages: ['cuisine'], public_cible: ['restauration'], lavage_max: 60, style: ['workwear'] } },
  { condition: (_, t) => t.type === 'pantalon_cuisine', tags: { usages: ['cuisine'], public_cible: ['restauration'], lavage_max: 60, style: ['workwear'] } },
  { condition: (_, t) => t.type === 'chaussure', tags: { usages: ['cuisine', 'chantier'], public_cible: ['restauration', 'btp'] } },
  { condition: (_, t) => t.type === 'bermuda', tags: { saison: ['ete'] } },
  { condition: (_, t) => t.type === 'bonnet', tags: { saison: ['hiver'] } },

  // ── Par prix ──
  { condition: (p) => (p.prix_vente_ht || 0) > 25, tags: { niveau_gamme: 'milieu' } },
  { condition: (p) => (p.prix_vente_ht || 0) > 40, tags: { niveau_gamme: 'premium' } },
  { condition: (p) => (p.prix_vente_ht || 0) < 8, tags: { niveau_gamme: 'entree', usages: ['evenement'] } },

  // ── Par certifications ──
  { condition: (p) => p.certifications.includes('Bio'), tags: { style: ['chic'], niveau_gamme: 'premium' } },
  { condition: (p) => p.certifications.includes('Oeko-Tex'), tags: { usages: ['quotidien'] } },

  // ── Par normes ──
  { condition: (p) => p.normes.includes('EN-ISO-20471'), tags: { public_cible: ['btp', 'logistique'], style: ['workwear'] } },
  { condition: (p) => p.normes.includes('EN1149-5'), tags: { public_cible: ['btp'], style: ['workwear'] } },
  { condition: (p) => p.normes.includes('HACCP'), tags: { public_cible: ['restauration'], lavage_max: 60 } },

  // ── Broderie vs sérigraphie ──
  { condition: (_, t) => t.gamme === 'lourd' && t.matiere === 'coton', tags: { techniques_marquage: ['broderie'] } },
  { condition: (_, t) => t.type === 'polo', tags: { techniques_marquage: ['broderie'] } },

  // ── Lavage depuis description ──
  { condition: (p) => /60\s*°/.test(p.description), tags: { lavage_max: 60 } },
  { condition: (p) => /95\s*°/.test(p.description), tags: { lavage_max: 95 } },
];

// ─── Moteur principal ────────────────────────────────────────────────────────

export function tagProduct(product: ProductData): ProductTags {
  const famille = detectFamille(product.categorie);
  const type = detectType(product.nom, product.categorie);
  const matiere = detectMatiere(product.description);
  const gamme = detectGammeGrammage(product.grammage, type);

  // Tags par défaut
  const tags: ProductTags = {
    famille,
    type,
    matiere,
    gamme_grammage: gamme,
    usages: [],
    saison: ['toute_saison'],
    techniques_marquage: [],
    niveau_gamme: 'milieu',
    lavage_max: 40,
    style: [],
    public_cible: [],
  };

  // Appliquer les règles (merge, pas replace)
  const taxo = { famille, type, matiere, gamme };
  for (const rule of RULES) {
    if (rule.condition(product, taxo)) {
      if (rule.tags.usages) tags.usages = Array.from(new Set([...tags.usages, ...rule.tags.usages]));
      if (rule.tags.saison) tags.saison = Array.from(new Set([...tags.saison, ...rule.tags.saison]));
      if (rule.tags.techniques_marquage) tags.techniques_marquage = Array.from(new Set([...tags.techniques_marquage, ...rule.tags.techniques_marquage]));
      if (rule.tags.style) tags.style = Array.from(new Set([...tags.style, ...rule.tags.style]));
      if (rule.tags.public_cible) tags.public_cible = Array.from(new Set([...tags.public_cible, ...rule.tags.public_cible]));
      if (rule.tags.niveau_gamme) tags.niveau_gamme = rule.tags.niveau_gamme;
      if (rule.tags.lavage_max && rule.tags.lavage_max > tags.lavage_max) tags.lavage_max = rule.tags.lavage_max;
    }
  }

  // Nettoyage
  if (tags.usages.length === 0) tags.usages = ['quotidien'];
  if (tags.style.length === 0) tags.style = ['casual'];
  if (tags.techniques_marquage.length === 0) tags.techniques_marquage = ['broderie', 'serigraphie'];

  return tags;
}
