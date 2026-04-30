// qualification-steps.ts
// Flow de qualification v4 — vendeur en boutique
// 1. Occasion → 2. Idée ou guidé → 3. Pièces → 4. Style+couleur PAR PIÈCE → 5. Coupe → 6. Marquage → Récap

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
  type: 'single' | 'multi' | 'brief'; // brief = textarea libre
  options: StepOption[];
  condition?: (ctx: Partial<QualificationContext>) => boolean;
  next?: (value: string | string[], ctx: Partial<QualificationContext>) => string | null;
  preselect?: (ctx: Partial<QualificationContext>) => string[];
}

export interface PieceConfig {
  typology: string;    // 'T-shirts', 'Polos', etc.
  style?: string;      // 'casual', 'chic', 'sportswear', 'classique'
  couleurs?: string[]; // ['noir', 'marine', ...]
}

export interface QualificationContext {
  // Flow vendeur
  occasion?: string;          // 'evenement' | 'quotidien' | 'communication' | 'cadeau' | 'workwear'
  approche?: string;          // 'idee' | 'guide'
  brief_text?: string;        // texte libre si approche=idee
  typologies?: string[];      // pièces sélectionnées
  pieces_config?: PieceConfig[]; // config par pièce (style + couleur)
  coupe?: string;             // 'homme' | 'femme' | 'unisexe' | 'mixte'
  marquage?: string;          // 'broderie' | 'serigraphie' | 'dtf' | 'neutre' | 'conseil'

  // Workwear spécifique
  secteur?: string;
  metier?: string;

  // Compat scoring
  style?: string;             // style global (dérivé de la première pièce ou le plus fréquent)
  repartition_hf?: string;    // mappé depuis coupe
  usage?: string;             // mappé depuis occasion
  couleur?: string[];         // toutes les couleurs sélectionnées (union)

  // Ancien système (compat)
  univers?: string;
  budget_qualite?: string;
  a_budget?: boolean;
  budget_tranche?: string;
  budget_global?: number;
  nb_personnes?: string;
  environnement?: string;
  categorie_accessoire?: string;
  produits_genres?: string;
  delai?: string;
}

// ─────────────────────────────────────────────
// PIÈCES SUGGÉRÉES PAR OCCASION
// ─────────────────────────────────────────────

const PIECES_PAR_OCCASION: Record<string, string[]> = {
  evenement:      ['T-shirts', 'Sweats', 'Casquettes'],
  quotidien:      ['Polos', 'Pantalons', 'Sweats'],
  communication:  ['T-shirts', 'Sweats', 'Casquettes'],
  cadeau:         ['Sweats', 'Vestes', 'Casquettes'],
  workwear:       ['T-shirts', 'Pantalons', 'Vestes'],
};

// ─────────────────────────────────────────────
// OPTIONS TYPOLOGIES PAR CONTEXTE
// ─────────────────────────────────────────────

const TYPO_OPTIONS_DEFAULT: StepOption[] = [
  { value: 'T-shirts',    label: 'T-shirts',             emoji: '👕' },
  { value: 'Polos',       label: 'Polos',                emoji: '👔' },
  { value: 'Chemises',    label: 'Chemises',             emoji: '🪢' },
  { value: 'Sweats',      label: 'Sweats / Hoodies',     emoji: '🧶' },
  { value: 'Vestes',      label: 'Vestes',               emoji: '🧥' },
  { value: 'Pantalons',   label: 'Pantalons',            emoji: '👖' },
  { value: 'Tabliers',    label: 'Tabliers',             emoji: '🍳' },
  { value: 'Casquettes',  label: 'Casquettes',            emoji: '🧢' },
  { value: 'Bonnets',     label: 'Bonnets',               emoji: '🧶' },
];

const TYPO_OPTIONS_WORKWEAR: Record<string, StepOption[]> = {
  restauration: [
    { value: 'Vestes',     label: 'Vestes de cuisine',    emoji: '👨‍🍳' },
    { value: 'Pantalons',  label: 'Pantalons de cuisine', emoji: '👖' },
    { value: 'Tabliers',   label: 'Tabliers',             emoji: '🍳' },
    { value: 'T-shirts',   label: 'T-shirts',             emoji: '👕' },
    { value: 'Polos',      label: 'Polos',                emoji: '👔' },
  ],
  btp: [
    { value: 'T-shirts',   label: 'T-shirts',             emoji: '👕' },
    { value: 'Pantalons',  label: 'Pantalons de travail', emoji: '👖' },
    { value: 'Vestes',     label: 'Vestes / Softshells',  emoji: '🧥' },
    { value: 'Sweats',     label: 'Sweats / Polaires',    emoji: '🧶' },
  ],
  industrie: [
    { value: 'T-shirts',   label: 'T-shirts',             emoji: '👕' },
    { value: 'Pantalons',  label: 'Pantalons de travail', emoji: '👖' },
    { value: 'Vestes',     label: 'Vestes / Blouses',     emoji: '🧥' },
    { value: 'Sweats',     label: 'Sweats / Polaires',    emoji: '🧶' },
  ],
  sante: [
    { value: 'T-shirts',   label: 'Tuniques / T-shirts',  emoji: '👕' },
    { value: 'Pantalons',  label: 'Pantalons',            emoji: '👖' },
    { value: 'Vestes',     label: 'Blouses',              emoji: '🥼' },
  ],
};

export function getTypologyOptions(ctx: Partial<QualificationContext>): StepOption[] {
  if (ctx.occasion === 'workwear' && ctx.secteur) {
    return TYPO_OPTIONS_WORKWEAR[ctx.secteur] || TYPO_OPTIONS_DEFAULT;
  }
  return TYPO_OPTIONS_DEFAULT;
}

// ─────────────────────────────────────────────
// COULEURS TENDANCE
// ─────────────────────────────────────────────

const COULEUR_OPTIONS: StepOption[] = [
  { value: 'noir',       label: 'Noir',         emoji: '⚫' },
  { value: 'marine',     label: 'Marine',       emoji: '🔵' },
  { value: 'blanc',      label: 'Blanc',        emoji: '⚪' },
  { value: 'gris',       label: 'Gris chiné',   emoji: '🩶' },
  { value: 'beige',      label: 'Beige',        emoji: '🟡' },
  { value: 'terracotta', label: 'Terracotta',   emoji: '🟠' },
  { value: 'bordeaux',   label: 'Bordeaux',     emoji: '🟤' },
  { value: 'vert_sapin', label: 'Vert sapin',   emoji: '🟢' },
  { value: 'rouge',      label: 'Rouge',        emoji: '🔴' },
  { value: 'bleu_ciel',  label: 'Bleu ciel',    emoji: '💙' },
  { value: 'marque',     label: 'Couleurs de ma marque', emoji: '🎨' },
];

const STYLE_OPTIONS: StepOption[] = [
  { value: 'casual',      label: 'Casual',      sub: 'Décontracté, confort' },
  { value: 'chic',        label: 'Chic',        sub: 'Élégant, finitions soignées' },
  { value: 'sportswear',  label: 'Sportswear',  sub: 'Dynamique, respirant' },
  { value: 'classique',   label: 'Classique',   sub: 'Sobre, professionnel' },
];

// ─────────────────────────────────────────────
// STEPS STATIQUES (avant la boucle par pièce)
// ─────────────────────────────────────────────

export const STATIC_STEPS: QualificationStep[] = [

  // ── 1. OCCASION ───────────────────────────────────────────────────────────

  {
    id: 'occasion',
    question: 'Bonjour ! C\'est pour quelle occasion ?',
    type: 'single',
    // Skip si occasion déjà connue (prefill depuis HP packs / pages secteur).
    condition: (ctx) => !ctx.occasion,
    options: [
      { value: 'evenement',     label: 'Un événement',         emoji: '🎉', sub: 'Salon, séminaire, soirée, team building' },
      { value: 'quotidien',     label: 'Le quotidien pro',     emoji: '💼', sub: 'Tenue d\'équipe, vêtement de travail' },
      { value: 'communication', label: 'De la communication',  emoji: '📣', sub: 'Goodies, cadeaux clients, visibilité' },
      { value: 'cadeau',        label: 'Un cadeau',            emoji: '🎁', sub: 'Welcome pack, fin d\'année, remerciement' },
      { value: 'workwear',      label: 'Du vêtement pro / EPI',emoji: '🦺', sub: 'Cuisine, BTP, industrie, santé' },
    ],
    next: (value) => value === 'workwear' ? 'secteur' : 'approche',
  },

  // ── 1bis. SECTEUR (workwear) ──────────────────────────────────────────────

  {
    id: 'secteur',
    question: 'Dans quel secteur ?',
    type: 'single',
    // Skip si on a déjà un secteur (prefill /btp, /sante, etc.) ou si occasion ≠ workwear.
    condition: (ctx) => ctx.occasion === 'workwear' && !ctx.secteur,
    options: [
      { value: 'restauration',  label: 'Restauration',          emoji: '🍳' },
      { value: 'btp',           label: 'BTP / Construction',     emoji: '🏗️' },
      { value: 'industrie',     label: 'Industrie',              emoji: '🏭' },
      { value: 'sante',         label: 'Santé / Médical',        emoji: '🏥' },
      { value: 'nettoyage',     label: 'Nettoyage / Propreté',   emoji: '🧹' },
      { value: 'securite',      label: 'Sécurité',               emoji: '🛡️' },
      { value: 'espaces_verts', label: 'Espaces verts',          emoji: '🌿' },
    ],
  },

  // ── 2. APPROCHE ───────────────────────────────────────────────────────────

  {
    id: 'approche',
    question: 'Vous avez déjà une idée de ce qu\'il vous faut ?',
    type: 'single',
    // Skip si typologies déjà connues (prefill depuis pack HP) — l'approche est implicite.
    condition: (ctx) => !ctx.approche && !(ctx.typologies && ctx.typologies.length > 0),
    options: [
      { value: 'idee',  label: 'Oui, je sais ce qu\'il me faut', emoji: '💡', sub: 'On passe aux détails textile' },
      { value: 'guide', label: 'Non, j\'ai besoin de conseils',   emoji: '🧭', sub: 'Décrivez votre projet, on vous guide' },
    ],
    next: (value) => value === 'idee' ? 'typologies' : 'brief',
  },

  // ── 2bis. BRIEF LIBRE (pour ceux qui ne savent pas) ───────────────────────

  {
    id: 'brief',
    question: 'Décrivez votre projet en quelques mots :',
    sous_titre: 'Ex: "On ouvre un restaurant et il faut habiller 15 personnes" — on s\'occupe du reste !',
    type: 'brief',
    options: [], // pas d'options, c'est un textarea
    condition: (ctx) => ctx.approche === 'guide',
    next: () => null, // fin du flow → extraction par l'IA
  },

  // ── 3. PIÈCES (pour ceux qui savent) ──────────────────────────────────────

  {
    id: 'typologies',
    question: 'Qu\'est-ce qui vous intéresse ?',
    sous_titre: 'Sélectionnez une ou plusieurs pièces.',
    type: 'multi',
    options: [], // rempli dynamiquement via getTypologyOptions()
    preselect: (ctx) => PIECES_PAR_OCCASION[ctx.occasion || ''] || [],
    // Skip si typologies déjà fournies (prefill pack HP) ou si on est sur le flow guide (brief libre).
    condition: (ctx) => ctx.approche !== 'guide' && !(ctx.typologies && ctx.typologies.length > 0),
  },

  // ── Les étapes 4 (style+couleur par pièce) sont générées dynamiquement ──
  // ── Voir generatePieceSteps() ci-dessous ──────────────────────────────────

];

// ─────────────────────────────────────────────
// STEPS APRÈS LA BOUCLE PAR PIÈCE
// ─────────────────────────────────────────────

export const POST_PIECE_STEPS: QualificationStep[] = [

  // ── 4bis. STYLE GLOBAL ────────────────────────────────────────────────────

  {
    id: 'style',
    question: 'Quel style d\'ensemble ?',
    sous_titre: 'Appliqué à toutes les pièces du pack.',
    type: 'single',
    options: STYLE_OPTIONS,
  },

  // ── 5. COUPE ──────────────────────────────────────────────────────────────

  {
    id: 'coupe',
    question: 'C\'est pour qui ?',
    type: 'single',
    options: [
      { value: 'homme',   label: 'Hommes' },
      { value: 'femme',   label: 'Femmes' },
      { value: 'mixte',   label: 'Mixte',    sub: 'Hommes + femmes' },
      { value: 'unisexe', label: 'Unisexe',  sub: 'Même coupe pour tous' },
    ],
  },

  // ── 6. MARQUAGE ───────────────────────────────────────────────────────────

  {
    id: 'marquage',
    question: 'Vous souhaitez un marquage ?',
    sous_titre: 'Logo, texte ou visuel sur les pièces.',
    type: 'single',
    options: [
      { value: 'broderie',    label: 'Broderie',          emoji: '🪡', sub: 'Premium, durable' },
      { value: 'serigraphie', label: 'Sérigraphie',       emoji: '🖨️', sub: 'Gros volumes, couleurs vives' },
      { value: 'dtf',         label: 'DTF / Transfert',   emoji: '🎨', sub: 'Photo, dégradés' },
      { value: 'neutre',      label: 'Sans marquage',     emoji: '✖️' },
      { value: 'conseil',     label: 'Conseillez-moi',    emoji: '💡' },
    ],
  },
];

// ─────────────────────────────────────────────
// GÉNÉRATION DYNAMIQUE DES ÉTAPES PAR PIÈCE
// ─────────────────────────────────────────────

export function generatePieceSteps(typologies: string[]): QualificationStep[] {
  const steps: QualificationStep[] = [];

  // Couleur par pièce uniquement — le style est demandé une fois globalement (POST_PIECE_STEPS)
  for (const typo of typologies) {
    steps.push({
      id: `couleur_${typo}`,
      question: `${typo} — quelle(s) couleur(s) ?`,
      sous_titre: 'Plusieurs choix possibles.',
      type: 'multi',
      options: COULEUR_OPTIONS,
    });
  }

  return steps;
}

// ─────────────────────────────────────────────
// CONSTRUCTION DU FLOW COMPLET
// ─────────────────────────────────────────────

/**
 * Retourne toutes les étapes dans l'ordre.
 * Appelé à chaque changement de contexte pour régénérer les étapes dynamiques.
 */
export function buildSteps(ctx: Partial<QualificationContext>): QualificationStep[] {
  const steps = [...STATIC_STEPS];

  // Si des typologies sont sélectionnées, insérer les étapes par pièce
  if (ctx.typologies && ctx.typologies.length > 0 && ctx.approche !== 'guide') {
    steps.push(...generatePieceSteps(ctx.typologies));
  }

  // Ajouter les étapes post-pièce
  steps.push(...POST_PIECE_STEPS);

  return steps;
}

// ─────────────────────────────────────────────
// COMPAT SCORING
// ─────────────────────────────────────────────

export const BUDGET_TRANCHE_MAP: Record<string, number> = {
  '0-200': 150, '200-500': 350, '500-1000': 750, '1000-3000': 2000, '3000+': 5000,
};

const OCCASION_TO_USAGE: Record<string, string> = {
  evenement: 'evenement',
  quotidien: 'quotidien',
  communication: 'image',
  cadeau: 'image',
  workwear: 'quotidien',
};

/**
 * Convertit le contexte de qualification en PromptContext pour le scoring/prompt
 */
export function qualificationToPromptContext(ctx: QualificationContext) {
  // Dériver le style global depuis les pièces (le plus fréquent)
  const styles = (ctx.pieces_config || []).map(p => p.style).filter(Boolean) as string[];
  const styleCounts: Record<string, number> = {};
  styles.forEach(s => { styleCounts[s] = (styleCounts[s] || 0) + 1; });
  const globalStyle = Object.entries(styleCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  // Union de toutes les couleurs
  const allCouleurs = Array.from(new Set((ctx.pieces_config || []).flatMap(p => p.couleurs || [])));

  // Mapper coupe vers repartition_hf
  const repMap: Record<string, string> = { homme: '100h', femme: '100f', mixte: 'mixte', unisexe: 'mixte' };

  return {
    secteur: ctx.secteur,
    metier: ctx.metier,
    typologies: ctx.typologies,
    style: globalStyle || ctx.style,
    repartition_hf: repMap[ctx.coupe || ''] || 'mixte',
    couleurs: allCouleurs.length > 0 ? allCouleurs : undefined,
    usage: OCCASION_TO_USAGE[ctx.occasion || ''] || 'quotidien',
    budget_global: ctx.budget_global ?? undefined,
  };
}

// Compat ancien système
export function getStepsForContext(): QualificationStep[] {
  return buildSteps({});
}

/**
 * Résumé de qualification pour le chat
 */
export function buildQualificationSummary(ctx: QualificationContext): string {
  const labels: Record<string, string> = {
    evenement: 'Événement', quotidien: 'Quotidien pro', communication: 'Communication', cadeau: 'Cadeau', workwear: 'Vêtement pro',
    homme: 'Hommes', femme: 'Femmes', mixte: 'Mixte', unisexe: 'Unisexe',
    broderie: 'Broderie', serigraphie: 'Sérigraphie', dtf: 'DTF', neutre: 'Sans marquage', conseil: 'À conseiller',
  };
  const l = (key?: string) => key ? (labels[key] || key) : null;

  const lignes = [
    `**Occasion :** ${l(ctx.occasion)}`,
    ctx.secteur ? `**Secteur :** ${ctx.secteur}` : null,
    ctx.typologies?.length ? `**Pièces :** ${ctx.typologies.join(', ')}` : null,
  ];

  // Détail par pièce
  if (ctx.pieces_config?.length) {
    for (const pc of ctx.pieces_config) {
      const parts = [pc.style, pc.couleurs?.join(', ')].filter(Boolean).join(' — ');
      if (parts) lignes.push(`  → ${pc.typology} : ${parts}`);
    }
  }

  lignes.push(
    ctx.coupe ? `**Coupe :** ${l(ctx.coupe)}` : null,
    ctx.marquage ? `**Marquage :** ${l(ctx.marquage)}` : null,
  );

  return lignes.filter(Boolean).join('\n');
}
