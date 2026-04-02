// qualification-steps.ts
// Flow de qualification v3 — Univers > Usage > Pièces > Style > Équipe > Couleur > Marquage > Délai > Budget

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface StepOption {
  value: string;
  label: string;
  emoji?: string;
  sub?: string;
  alerte?: string;
}

export interface QualificationStep {
  id: string;
  question: string;
  sous_titre?: string;
  type: 'single' | 'multi';
  options: StepOption[];
  condition?: (ctx: Partial<QualificationContext>) => boolean;
  next?: (value: string | string[], ctx: Partial<QualificationContext>) => string | null;
  // Pré-sélection automatique d'options selon le contexte
  preselect?: (ctx: Partial<QualificationContext>) => string[];
}

export interface QualificationContext {
  univers: string;              // 'lifestyle' | 'workwear' | 'accessoires'
  usage?: string;               // lifestyle: 'communication' | 'quotidien' | 'evenement'
  secteur?: string;             // workwear: 'restauration' | 'btp' | 'industrie' | 'sante' | 'nettoyage' | 'securite' | 'espaces_verts'
  metier?: string;              // sous-métier workwear
  categorie_accessoire?: string;// accessoires: 'hightech' | 'ecriture' | 'boisson' | 'autre'
  typologies?: string[];        // pièces sélectionnées
  style?: string;               // lifestyle only: 'casual' | 'chic' | 'sportswear' | 'classique'
  repartition_hf?: string;      // 'homme' | 'femme' | 'mixte'
  produits_genres?: string;     // si mixte/femme: 'unisexe' | 'genres'
  couleur?: string[];
  marquage?: string;            // 'broderie' | 'serigraphie' | 'dtf' | 'neutre'
  delai?: string;
  budget_qualite?: string;      // 'essentiel' | 'milieu' | 'premium'
  // Compat avec l'ancien système
  a_budget?: boolean;
  budget_tranche?: string;
  budget_global?: number;
  nb_personnes?: string;
  environnement?: string;
}

// ─────────────────────────────────────────────
// PIÈCES SUGGÉRÉES PAR CONTEXTE
// ─────────────────────────────────────────────

const TYPOLOGIES_MAP: Record<string, Record<string, string[]>> = {
  lifestyle: {
    communication:  ['T-shirts', 'Sweats', 'Casquettes / Bonnets'],
    quotidien:      ['Polos', 'Chemises', 'Pantalons', 'Sweats'],
    evenement:      ['T-shirts', 'Sweats', 'Vestes', 'Casquettes / Bonnets'],
  },
  workwear: {
    restauration:   ['Vestes', 'Pantalons', 'Tabliers', 'T-shirts'],
    btp:            ['T-shirts', 'Pantalons', 'Vestes', 'Sweats'],
    industrie:      ['T-shirts', 'Pantalons', 'Vestes', 'Sweats'],
    sante:          ['T-shirts', 'Pantalons', 'Vestes'],
    nettoyage:      ['T-shirts', 'Pantalons', 'Tabliers'],
    securite:       ['Polos', 'Pantalons', 'Vestes'],
    espaces_verts:  ['T-shirts', 'Pantalons', 'Vestes', 'Sweats'],
  },
};

// Options typologies selon le contexte
const TYPO_OPTIONS_LIFESTYLE: StepOption[] = [
  { value: 'T-shirts',    label: 'T-shirts',             emoji: '👕' },
  { value: 'Polos',       label: 'Polos',                emoji: '👔' },
  { value: 'Chemises',    label: 'Chemises',             emoji: '🪢' },
  { value: 'Sweats',      label: 'Sweats / Hoodies',     emoji: '🧶' },
  { value: 'Vestes',      label: 'Vestes / Manteaux',    emoji: '🧥' },
  { value: 'Pantalons',   label: 'Pantalons',            emoji: '👖' },
  { value: 'Accessoires', label: 'Casquettes / Bonnets', emoji: '🧢' },
];

const TYPO_OPTIONS_WORKWEAR: Record<string, StepOption[]> = {
  restauration: [
    { value: 'Vestes',     label: 'Vestes de cuisine',  emoji: '👨‍🍳' },
    { value: 'Pantalons',  label: 'Pantalons de cuisine', emoji: '👖' },
    { value: 'Tabliers',   label: 'Tabliers',           emoji: '🍳' },
    { value: 'T-shirts',   label: 'T-shirts',           emoji: '👕' },
    { value: 'Polos',      label: 'Polos',              emoji: '👔' },
    { value: 'Accessoires',label: 'Toques / Calots',    emoji: '🧑‍🍳' },
  ],
  btp: [
    { value: 'T-shirts',   label: 'T-shirts',           emoji: '👕' },
    { value: 'Polos',      label: 'Polos',              emoji: '👔' },
    { value: 'Pantalons',  label: 'Pantalons de travail', emoji: '👖' },
    { value: 'Vestes',     label: 'Vestes / Softshells', emoji: '🧥' },
    { value: 'Sweats',     label: 'Sweats / Polaires',  emoji: '🧶' },
    { value: 'Accessoires',label: 'Casques / Bonnets',  emoji: '⛑️' },
  ],
  industrie: [
    { value: 'T-shirts',   label: 'T-shirts',           emoji: '👕' },
    { value: 'Polos',      label: 'Polos',              emoji: '👔' },
    { value: 'Pantalons',  label: 'Pantalons de travail', emoji: '👖' },
    { value: 'Vestes',     label: 'Vestes / Blouses',   emoji: '🧥' },
    { value: 'Sweats',     label: 'Sweats / Polaires',  emoji: '🧶' },
  ],
  sante: [
    { value: 'T-shirts',   label: 'Tuniques / T-shirts', emoji: '👕' },
    { value: 'Pantalons',  label: 'Pantalons',          emoji: '👖' },
    { value: 'Vestes',     label: 'Blouses',            emoji: '🥼' },
  ],
  nettoyage: [
    { value: 'T-shirts',   label: 'T-shirts',           emoji: '👕' },
    { value: 'Pantalons',  label: 'Pantalons',          emoji: '👖' },
    { value: 'Tabliers',   label: 'Tabliers',           emoji: '🧹' },
    { value: 'Vestes',     label: 'Vestes',             emoji: '🧥' },
  ],
  securite: [
    { value: 'Polos',      label: 'Polos',              emoji: '👔' },
    { value: 'Pantalons',  label: 'Pantalons',          emoji: '👖' },
    { value: 'Vestes',     label: 'Vestes',             emoji: '🧥' },
    { value: 'Sweats',     label: 'Sweats / Polaires',  emoji: '🧶' },
  ],
  espaces_verts: [
    { value: 'T-shirts',   label: 'T-shirts',           emoji: '👕' },
    { value: 'Pantalons',  label: 'Pantalons de travail', emoji: '👖' },
    { value: 'Vestes',     label: 'Vestes / Parkas',    emoji: '🧥' },
    { value: 'Sweats',     label: 'Sweats / Polaires',  emoji: '🧶' },
  ],
};

// Fallback workwear générique
const TYPO_OPTIONS_WORKWEAR_DEFAULT: StepOption[] = [
  { value: 'T-shirts',   label: 'T-shirts',           emoji: '👕' },
  { value: 'Polos',      label: 'Polos',              emoji: '👔' },
  { value: 'Pantalons',  label: 'Pantalons',          emoji: '👖' },
  { value: 'Vestes',     label: 'Vestes',             emoji: '🧥' },
  { value: 'Sweats',     label: 'Sweats',             emoji: '🧶' },
  { value: 'Tabliers',   label: 'Tabliers',           emoji: '🍳' },
];

export function getTypologyOptions(ctx: Partial<QualificationContext>): StepOption[] {
  if (ctx.univers === 'lifestyle') return TYPO_OPTIONS_LIFESTYLE;
  if (ctx.univers === 'workwear' && ctx.secteur) {
    return TYPO_OPTIONS_WORKWEAR[ctx.secteur] || TYPO_OPTIONS_WORKWEAR_DEFAULT;
  }
  return TYPO_OPTIONS_WORKWEAR_DEFAULT;
}

function getSuggestedTypologies(ctx: Partial<QualificationContext>): string[] {
  if (ctx.univers === 'lifestyle' && ctx.usage) {
    return TYPOLOGIES_MAP.lifestyle[ctx.usage] || [];
  }
  if (ctx.univers === 'workwear' && ctx.secteur) {
    return TYPOLOGIES_MAP.workwear[ctx.secteur] || [];
  }
  return [];
}

// ─────────────────────────────────────────────
// STEPS
// ─────────────────────────────────────────────

export const QUALIFICATION_STEPS: QualificationStep[] = [

  // ── 1. UNIVERS ────────────────────────────────────────────────────────────

  {
    id: 'univers',
    question: 'Que recherchez-vous ?',
    type: 'single',
    options: [
      { value: 'lifestyle',    label: 'Textile',         emoji: '👕', sub: 'T-shirts, polos, sweats, vestes...' },
      { value: 'workwear',     label: 'Vêtement pro',    emoji: '🦺', sub: 'Cuisine, BTP, industrie, santé...' },
      { value: 'accessoires',  label: 'Objets & Goodies',emoji: '🎁', sub: 'Hightech, stylos, mugs, sacs...' },
    ],
    next: (value) => {
      if (value === 'lifestyle') return 'usage_lifestyle';
      if (value === 'workwear') return 'secteur_workwear';
      if (value === 'accessoires') return 'categorie_accessoire';
      return null;
    },
  },

  // ── 2a. USAGE LIFESTYLE ───────────────────────────────────────────────────

  {
    id: 'usage_lifestyle',
    question: 'C\'est pour quel usage ?',
    type: 'single',
    condition: (ctx) => ctx.univers === 'lifestyle',
    options: [
      { value: 'communication', label: 'Communication',       emoji: '📣', sub: 'Visibilité, goodies, cadeaux clients' },
      { value: 'quotidien',     label: 'Travail quotidien',   emoji: '💼', sub: 'Porté tous les jours par vos équipes' },
      { value: 'evenement',     label: 'Événement',           emoji: '🎉', sub: 'Salon, séminaire, team building' },
    ],
    next: () => 'typologies',
  },

  // ── 2b. SECTEUR WORKWEAR ──────────────────────────────────────────────────

  {
    id: 'secteur_workwear',
    question: 'Dans quelle industrie ?',
    type: 'single',
    condition: (ctx) => ctx.univers === 'workwear',
    options: [
      { value: 'restauration',  label: 'Restauration',        emoji: '🍳', sub: 'Cuisine, service, boulangerie' },
      { value: 'btp',           label: 'BTP / Construction',   emoji: '🏗️', sub: 'Chantier, rénovation, TP' },
      { value: 'industrie',     label: 'Industrie',            emoji: '🏭', sub: 'Production, logistique, entrepôt' },
      { value: 'sante',         label: 'Santé / Médical',      emoji: '🏥', sub: 'Hôpital, labo, pharmacie' },
      { value: 'nettoyage',     label: 'Nettoyage / Propreté', emoji: '🧹', sub: 'Entretien, hygiène' },
      { value: 'securite',      label: 'Sécurité / Gardiennage', emoji: '🛡️' },
      { value: 'espaces_verts', label: 'Espaces verts',        emoji: '🌿', sub: 'Paysagisme, entretien' },
    ],
    next: (value) => {
      if (value === 'restauration') return 'metier_restauration';
      if (value === 'btp') return 'metier_btp';
      if (value === 'industrie') return 'metier_industrie';
      return 'typologies';
    },
  },

  // ── 2b-i. MÉTIER RESTAURATION ─────────────────────────────────────────────

  {
    id: 'metier_restauration',
    question: 'Quel poste ?',
    type: 'single',
    condition: (ctx) => ctx.secteur === 'restauration',
    options: [
      { value: 'chef_cuisine',  label: 'Chef / Cuisinier',    emoji: '👨‍🍳', sub: 'Veste, pantalon, tablier, toque' },
      { value: 'serveur',       label: 'Serveur / Salle',     emoji: '🍽️', sub: 'Polo, chemise, tablier' },
      { value: 'boulanger',     label: 'Boulanger / Pâtissier', emoji: '🥖', sub: 'Veste, tablier, calot' },
      { value: 'boucher',       label: 'Boucher',             emoji: '🥩', sub: 'Tablier, gants anti-coupures', alerte: 'EN 388 niv.5 gants obligatoire' },
      { value: 'mixte_resto',   label: 'Plusieurs postes',    emoji: '🔄' },
    ],
    next: () => 'typologies',
  },

  // ── 2b-ii. MÉTIER BTP ─────────────────────────────────────────────────────

  {
    id: 'metier_btp',
    question: 'Quel(s) métier(s) ?',
    type: 'single',
    condition: (ctx) => ctx.secteur === 'btp',
    options: [
      { value: 'macon',             label: 'Maçon / Gros œuvre',     emoji: '🧱', sub: 'EN ISO 20345 S3' },
      { value: 'electricien',       label: 'Électricien',             emoji: '⚡', sub: 'EN IEC 61482-2', alerte: 'Norme arc électrique — tissu spécifique requis' },
      { value: 'peintre',           label: 'Peintre / Façadier',      emoji: '🖌️', sub: 'EN 13034 Type 6' },
      { value: 'plombier',          label: 'Plombier / Chauffagiste', emoji: '🔧' },
      { value: 'conducteur_engins', label: 'Conducteur d\'engins',   emoji: '🚜', sub: 'Haute visibilité Cl.3', alerte: 'Haute visibilité classe 3 obligatoire' },
      { value: 'mixte_btp',         label: 'Plusieurs métiers',       emoji: '👷' },
    ],
    next: () => 'typologies',
  },

  // ── 2b-iii. MÉTIER INDUSTRIE ──────────────────────────────────────────────

  {
    id: 'metier_industrie',
    question: 'Quel poste ?',
    type: 'single',
    condition: (ctx) => ctx.secteur === 'industrie',
    options: [
      { value: 'operateur_chaine', label: 'Opérateur production', emoji: '🏭' },
      { value: 'soudeur',          label: 'Soudeur',              emoji: '🔥', alerte: '100% coton ou FR — synthétique interdit' },
      { value: 'logisticien',      label: 'Logisticien / Cariste', emoji: '📦', sub: 'EN ISO 20471 Cl.2' },
      { value: 'chimiste',         label: 'Chimie / Labo',        emoji: '🧪' },
      { value: 'mixte_industrie',  label: 'Plusieurs postes',     emoji: '🔄' },
    ],
    next: () => 'typologies',
  },

  // ── 2c. CATÉGORIE ACCESSOIRES ─────────────────────────────────────────────

  {
    id: 'categorie_accessoire',
    question: 'Quel type d\'objet ?',
    type: 'single',
    condition: (ctx) => ctx.univers === 'accessoires',
    options: [
      { value: 'hightech',  label: 'Hightech',        emoji: '📱', sub: 'Clés USB, enceintes, chargeurs' },
      { value: 'ecriture',  label: 'Écriture',        emoji: '🖊️', sub: 'Stylos, carnets, bloc-notes' },
      { value: 'boisson',   label: 'Mugs & Gourdes',  emoji: '☕', sub: 'Mugs, gourdes, thermos' },
      { value: 'bagagerie', label: 'Sacs & Bagagerie', emoji: '🎒', sub: 'Tote bags, sacs à dos, trousses' },
      { value: 'autre',     label: 'Autre',            emoji: '🎁' },
    ],
    next: () => 'couleur', // accessoires → pas de pièces/style/genre, direct couleur
  },

  // ── 3. PIÈCES (options filtrées dynamiquement dans le composant via getTypologyOptions) ──

  {
    id: 'typologies',
    question: 'On vous suggère ces pièces — ajustez si besoin :',
    sous_titre: 'Sélectionnez ou désélectionnez selon vos besoins.',
    type: 'multi',
    options: [], // Rempli dynamiquement par getTypologyOptions()
    preselect: getSuggestedTypologies,
    condition: (ctx) => ctx.univers !== 'accessoires',
    next: (_, ctx) => ctx.univers === 'lifestyle' ? 'style' : 'repartition_hf',
  },

  // ── 4. STYLE (lifestyle uniquement) ───────────────────────────────────────

  {
    id: 'style',
    question: 'Quel style ?',
    type: 'single',
    condition: (ctx) => ctx.univers === 'lifestyle',
    options: [
      { value: 'casual',      label: 'Casual',           emoji: '👕', sub: 'Confort, couleurs neutres ou vives' },
      { value: 'chic',        label: 'Casual chic',      emoji: '✨', sub: 'Élégant mais accessible' },
      { value: 'sportswear',  label: 'Sportswear',       emoji: '⚽', sub: 'Dynamique, matières techniques' },
      { value: 'classique',   label: 'Classique / Pro',  emoji: '👔', sub: 'Sobre, marine/noir/gris' },
    ],
  },

  // ── 5. ÉQUIPE ─────────────────────────────────────────────────────────────

  {
    id: 'repartition_hf',
    question: 'Pour qui ?',
    type: 'single',
    condition: (ctx) => ctx.univers !== 'accessoires',
    options: [
      { value: 'homme',  label: 'Hommes',  emoji: '👨' },
      { value: 'femme',  label: 'Femmes',  emoji: '👩' },
      { value: 'mixte',  label: 'Mixte',   emoji: '👫' },
    ],
    next: (value) => (value === 'mixte' || value === 'femme') ? 'produits_genres' : 'couleur',
  },

  // ── 5bis. UNISEXE OU GENRÉ ────────────────────────────────────────────────

  {
    id: 'produits_genres',
    question: 'Produits unisexe ou coupes genrées ?',
    type: 'single',
    condition: (ctx) => ctx.repartition_hf === 'mixte' || ctx.repartition_hf === 'femme',
    options: [
      { value: 'unisexe', label: 'Unisexe',          emoji: '🔄', sub: 'Même coupe pour tous' },
      { value: 'genres',  label: 'Coupes H/F',       emoji: '👫', sub: 'Coupes ajustées homme et femme' },
    ],
  },

  // ── 6. COULEUR ────────────────────────────────────────────────────────────

  {
    id: 'couleur',
    question: 'Couleur(s) souhaitée(s) ?',
    sous_titre: 'Plusieurs choix possibles.',
    type: 'multi',
    options: [
      { value: 'noir',       label: 'Noir',             emoji: '⚫' },
      { value: 'marine',     label: 'Marine',           emoji: '🔵' },
      { value: 'blanc',      label: 'Blanc',            emoji: '⚪' },
      { value: 'gris',       label: 'Gris chiné',       emoji: '🩶' },
      { value: 'beige',      label: 'Beige / Sable',    emoji: '🟡' },
      { value: 'terracotta', label: 'Terracotta',       emoji: '🟠' },
      { value: 'bordeaux',   label: 'Bordeaux',         emoji: '🟤' },
      { value: 'vert_sapin', label: 'Vert sapin',       emoji: '🟢' },
      { value: 'rouge',      label: 'Rouge',            emoji: '🔴' },
      { value: 'bleu_ciel',  label: 'Bleu ciel',        emoji: '💙' },
      { value: 'marque',     label: 'Couleurs de ma marque', emoji: '🎨', sub: 'Précisez dans le chat' },
    ],
  },

  // ── 7. MARQUAGE ───────────────────────────────────────────────────────────

  {
    id: 'marquage',
    question: 'Marquage ou neutre ?',
    sous_titre: 'On peut aussi vous conseiller dans le chat.',
    type: 'single',
    options: [
      { value: 'broderie',     label: 'Broderie',        emoji: '🪡', sub: 'Premium, durable, logo discret' },
      { value: 'serigraphie',  label: 'Sérigraphie',     emoji: '🖨️', sub: 'Gros volumes, couleurs vives' },
      { value: 'dtf',          label: 'DTF / Transfert',  emoji: '🎨', sub: 'Photo, dégradés, petites séries' },
      { value: 'neutre',       label: 'Sans marquage',    emoji: '✖️', sub: 'Textile brut' },
      { value: 'conseil',      label: 'Conseillez-moi',   emoji: '💡' },
    ],
  },

  // ── 8. DÉLAI ──────────────────────────────────────────────────────────────

  {
    id: 'delai',
    question: 'Quel est votre délai ?',
    type: 'single',
    options: [
      { value: 'urgent',   label: 'Urgent',     emoji: '⚡', sub: 'Moins d\'1 semaine' },
      { value: 'standard', label: '2-3 semaines',emoji: '📅' },
      { value: 'relax',    label: 'Pas pressé',  emoji: '🗓️', sub: '1 mois et plus' },
    ],
  },

  // ── 9. BUDGET (par niveau de qualité) ─────────────────────────────────────

  {
    id: 'budget_qualite',
    question: 'Quel niveau de qualité ?',
    sous_titre: 'Influence le grammage, les finitions et les matières.',
    type: 'single',
    condition: (ctx) => ctx.univers !== 'accessoires',
    options: [
      { value: 'essentiel', label: 'Essentiel',         emoji: '💶', sub: '~5-15 €/pièce · Événements, gros volumes' },
      { value: 'milieu',    label: 'Milieu de gamme',   emoji: '💰', sub: '~15-30 €/pièce · Usage régulier, bon rapport Q/P' },
      { value: 'premium',   label: 'Premium',           emoji: '💎', sub: '~30-60 €/pièce · Image de marque, finitions haut de gamme' },
    ],
  },

];

// ─────────────────────────────────────────────
// MAPPING BUDGET QUALITÉ → SCORING
// ─────────────────────────────────────────────

export const BUDGET_QUALITE_MAP: Record<string, { min: number; max: number }> = {
  essentiel: { min: 3, max: 15 },
  milieu:    { min: 12, max: 35 },
  premium:   { min: 25, max: 80 },
};

// Compat ancien système
export const BUDGET_TRANCHE_MAP: Record<string, number> = {
  '0-200':     150,
  '200-500':   350,
  '500-1000':  750,
  '1000-3000': 2000,
  '3000+':     5000,
};

// ─────────────────────────────────────────────
// FONCTIONS
// ─────────────────────────────────────────────

/**
 * Retourne les steps dans l'ordre pour un contexte donné,
 * en filtrant les steps conditionnels
 */
export function getStepsForContext(secteur?: string): QualificationStep[] {
  // On ne filtre plus par secteur au départ — le flow est dynamique
  return QUALIFICATION_STEPS;
}

/**
 * Convertit le contexte de qualification en PromptContext partiel
 */
export function qualificationToPromptContext(ctx: QualificationContext) {
  return {
    secteur: ctx.secteur,
    metier: ctx.metier,
    typologies: ctx.typologies,
    style: ctx.style,
    repartition_hf: ctx.repartition_hf === 'homme' ? '100h'
      : ctx.repartition_hf === 'femme' ? '100f'
      : 'mixte',
    usage: ctx.usage || environnementToUsage(ctx.environnement),
    budget_global: ctx.a_budget
      ? (ctx.budget_global ?? BUDGET_TRANCHE_MAP[ctx.budget_tranche ?? ''] ?? undefined)
      : undefined,
  };
}

function environnementToUsage(env?: string): string | undefined {
  const map: Record<string, string> = {
    salle:     'image',
    cuisine:   'quotidien',
    bureau:    'image',
    exterieur: 'quotidien',
    mixte:     'quotidien',
  };
  return env ? map[env] : undefined;
}

/**
 * Génère le résumé de qualification à afficher dans le chat
 */
export function buildQualificationSummary(ctx: QualificationContext): string {
  const labels: Record<string, string> = {
    lifestyle: 'Textile lifestyle', workwear: 'Vêtement professionnel', accessoires: 'Objets & Goodies',
    communication: 'Communication / Visibilité', quotidien: 'Travail quotidien', evenement: 'Événement',
    essentiel: 'Essentiel (~5-15€/pce)', milieu: 'Milieu de gamme (~15-30€/pce)', premium: 'Premium (~30-60€/pce)',
    homme: '100% Hommes', femme: '100% Femmes', mixte: 'Mixte',
    unisexe: 'Coupes unisexe', genres: 'Coupes H/F séparées',
    broderie: 'Broderie', serigraphie: 'Sérigraphie', dtf: 'DTF / Transfert', neutre: 'Sans marquage', conseil: 'À conseiller',
    urgent: 'Urgent (<1 sem)', standard: '2-3 semaines', relax: 'Pas pressé',
  };

  const l = (key?: string) => key ? (labels[key] || key) : null;

  const lignes = [
    `**Univers :** ${l(ctx.univers)}`,
    ctx.usage ? `**Usage :** ${l(ctx.usage)}` : null,
    ctx.secteur ? `**Secteur :** ${ctx.secteur}` : null,
    ctx.metier ? `**Métier :** ${ctx.metier}` : null,
    ctx.typologies?.length ? `**Pièces :** ${ctx.typologies.join(', ')}` : null,
    ctx.style ? `**Style :** ${ctx.style}` : null,
    ctx.repartition_hf ? `**Équipe :** ${l(ctx.repartition_hf)}` : null,
    ctx.produits_genres ? `**Coupes :** ${l(ctx.produits_genres)}` : null,
    ctx.couleur?.length ? `**Couleur(s) :** ${ctx.couleur.join(', ')}` : null,
    ctx.marquage ? `**Marquage :** ${l(ctx.marquage)}` : null,
    ctx.delai ? `**Délai :** ${l(ctx.delai)}` : null,
    ctx.budget_qualite ? `**Qualité :** ${l(ctx.budget_qualite)}` : null,
  ].filter(Boolean);

  return lignes.join('\n');
}
