// qualification-steps.ts
// Flow de qualification complet — tout en boutons, zéro saisie libre
// Branché sur le chat avant que Claude prenne la main

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface StepOption {
  value: string;
  label: string;
  emoji?: string;
  sub?: string;        // texte gris sous le bouton (normes, précisions)
  alerte?: string;     // bandeau orange/rouge si norme dure
}

export interface QualificationStep {
  id: string;
  question: string;
  sous_titre?: string;
  type: 'single' | 'multi';   // single = un seul choix / multi = plusieurs possibles
  options: StepOption[];
  condition?: (ctx: Partial<QualificationContext>) => boolean;  // step conditionnel
  next?: (value: string | string[], ctx: Partial<QualificationContext>) => string | null;
  // next retourne l'id du prochain step, ou null si fin du flow
}

export interface QualificationContext {
  secteur: string;
  metier?: string;
  environnement?: string;
  style?: string;
  repartition_hf?: string;
  couleur?: string | string[];
  delai?: string;
  a_budget?: boolean;
  budget_tranche?: string;
  budget_global?: number;    // valeur numérique injectée dans PromptContext
  nb_personnes?: string;
}

// ─────────────────────────────────────────────
// STEPS
// ─────────────────────────────────────────────

export const QUALIFICATION_STEPS: QualificationStep[] = [

  // ── ÉTAPE 0 : Métier (conditionnel BTP / Industrie) ──────────────────────

  {
    id: 'metier',
    question: 'Quel(s) métier(s) dans votre équipe ?',
    sous_titre: 'Les normes EPI varient selon le poste — indispensable pour garantir la conformité.',
    type: 'single',
    condition: (ctx) => ctx.secteur === 'btp' || ctx.secteur === 'industrie',
    options: [
      // BTP
      { value: 'macon',            label: 'Maçon / Gros œuvre',     emoji: '🧱', sub: 'EN ISO 20345 S3 · EN 14404 genoux',            condition_secteur: 'btp' },
      { value: 'electricien',      label: 'Électricien',             emoji: '⚡', sub: 'EN IEC 61482-2 · EN 1149', alerte: 'Norme arc électrique — tissu spécifique requis', condition_secteur: 'btp' },
      { value: 'peintre',          label: 'Peintre / Façadier',      emoji: '🖌️', sub: 'EN 13034 Type 6 · EN ISO 20471',               condition_secteur: 'btp' },
      { value: 'plombier',         label: 'Plombier / Chauffagiste', emoji: '🔧', sub: 'EN ISO 20345 S2 · EN 374',                     condition_secteur: 'btp' },
      { value: 'conducteur_engins',label: 'Conducteur d\'engins',   emoji: '🚜', sub: 'EN ISO 20471 Classe 3', alerte: 'Haute visibilité classe 3 obligatoire', condition_secteur: 'btp' },
      // Industrie
      { value: 'operateur_chaine', label: 'Opérateur production',   emoji: '🏭', sub: 'EN 340 · EN ISO 20345',                        condition_secteur: 'industrie' },
      { value: 'soudeur',          label: 'Soudeur',                emoji: '🔥', sub: 'EN ISO 11611 · EN ISO 11612', alerte: '100% coton ou FR traité — synthétique interdit', condition_secteur: 'industrie' },
      { value: 'logisticien',      label: 'Logisticien / Cariste',  emoji: '📦', sub: 'EN ISO 20471 Cl.2',                            condition_secteur: 'industrie' },
      { value: 'chimiste',         label: 'Chimie / Labo',          emoji: '🧪', sub: 'EN 13034 Type 6 · EN 374',                    condition_secteur: 'industrie' },
      // Commun
      { value: 'mixte',            label: 'Plusieurs métiers',      emoji: '👷', sub: 'Normes les plus restrictives appliquées' },
    ].filter(o => !o.condition_secteur || true), // le filtrage dynamique est fait dans getStepsForContext()
  },

  // ── ÉTAPE 1 : Environnement ───────────────────────────────────────────────

  {
    id: 'environnement',
    question: 'Dans quel environnement travaille votre équipe ?',
    type: 'single',
    options: [
      { value: 'salle',     label: 'Salle / Service client', emoji: '🍽️', sub: 'Contact public, image prioritaire' },
      { value: 'cuisine',   label: 'Cuisine / Production',   emoji: '👨‍🍳', sub: 'Chaleur, hygiène, lavage fréquent' },
      { value: 'bureau',    label: 'Bureau / Accueil',       emoji: '🏢', sub: 'Confort et représentation' },
      { value: 'exterieur', label: 'Extérieur / Chantier',   emoji: '🌿', sub: 'Résistance, intempéries, visibilité' },
      { value: 'mixte',     label: 'Mixte',                  emoji: '🔄', sub: 'Plusieurs environnements' },
    ],
  },

  // ── ÉTAPE 2 : Style ───────────────────────────────────────────────────────

  {
    id: 'style',
    question: 'Quel style pour votre équipe ?',
    type: 'single',
    options: [
      { value: 'classique',   label: 'Classique / Pro',    emoji: '👔', sub: 'Sobre, marine/noir/gris, structuré' },
      { value: 'chic',        label: 'Casual chic',        emoji: '✨', sub: 'Élégant mais accessible, coupes ajustées' },
      { value: 'casual',      label: 'Casual',             emoji: '👕', sub: 'Confort, couleurs neutres ou vives' },
      { value: 'sportswear',  label: 'Sportswear',         emoji: '⚽', sub: 'Dynamique, matières techniques' },
      { value: 'workwear',    label: 'Workwear technique', emoji: '🦺', sub: 'Fonctionnel, résistant, pratique' },
    ],
  },

  // ── ÉTAPE 3 : Répartition H/F ─────────────────────────────────────────────

  {
    id: 'repartition_hf',
    question: 'Composition de votre équipe ?',
    type: 'single',
    options: [
      { value: '100h',   label: '100% Hommes',        emoji: '👨' },
      { value: '100f',   label: '100% Femmes',        emoji: '👩' },
      { value: 'maj_h',  label: 'Majorité hommes',    emoji: '👨‍👩', sub: '~70% H / 30% F' },
      { value: 'maj_f',  label: 'Majorité femmes',    emoji: '👩‍👨', sub: '~30% H / 70% F' },
      { value: 'mixte',  label: 'Équilibre mixte',    emoji: '👫', sub: '~50% / 50%' },
    ],
  },

  // ── ÉTAPE 4 : Couleur ─────────────────────────────────────────────────────

  {
    id: 'couleur',
    question: 'Couleur(s) souhaitée(s) ?',
    sous_titre: 'Plusieurs choix possibles.',
    type: 'multi',
    options: [
      { value: 'noir',     label: 'Noir',           emoji: '⚫' },
      { value: 'marine',   label: 'Marine',         emoji: '🔵' },
      { value: 'blanc',    label: 'Blanc',          emoji: '⚪' },
      { value: 'gris',     label: 'Gris',           emoji: '🩶' },
      { value: 'rouge',    label: 'Rouge / Bordeaux', emoji: '🔴' },
      { value: 'vert',     label: 'Vert',           emoji: '🟢' },
      { value: 'beige',    label: 'Beige / Sable',  emoji: '🟤' },
      { value: 'marque',   label: 'Couleurs de ma marque', emoji: '🎨', sub: 'Précisez dans le chat après' },
    ],
  },

  // ── ÉTAPE 5 : Délai ───────────────────────────────────────────────────────

  {
    id: 'delai',
    question: 'Quel est votre délai ?',
    type: 'single',
    options: [
      { value: 'urgent',   label: 'Urgent',           emoji: '⚡', sub: 'Besoin sous 1 semaine' },
      { value: 'standard', label: 'Standard',         emoji: '📅', sub: '2 à 3 semaines' },
      { value: 'relax',    label: 'Pas pressé',       emoji: '🗓️', sub: '1 mois et plus' },
    ],
  },

  // ── ÉTAPE 6 : Budget — deux temps ─────────────────────────────────────────

  {
    id: 'budget_oui_non',
    question: 'Avez-vous une enveloppe budget définie ?',
    sous_titre: 'Aucune obligation — nous proposons le meilleur rapport qualité/prix par défaut.',
    type: 'single',
    options: [
      { value: 'oui', label: 'Oui, j\'ai un budget', emoji: '💰' },
      { value: 'non', label: 'Non, faites au mieux',  emoji: '🎯', sub: 'Meilleur rapport Q/P + option premium' },
    ],
    next: (value) => value === 'oui' ? 'budget_tranche' : null, // null = fin du flow
  },

  {
    id: 'budget_tranche',
    question: 'Quelle est votre enveloppe approximative ?',
    sous_titre: 'Pour l\'ensemble de la commande, hors marquage.',
    type: 'single',
    condition: (ctx) => ctx.a_budget === true,
    options: [
      { value: '0-200',     label: 'Moins de 200 €',    emoji: '💶', sub: 'Petite équipe ou budget serré' },
      { value: '200-500',   label: '200 – 500 €',       emoji: '💶' },
      { value: '500-1000',  label: '500 € – 1 000 €',   emoji: '💴' },
      { value: '1000-3000', label: '1 000 € – 3 000 €', emoji: '💵' },
      { value: '3000+',     label: 'Plus de 3 000 €',   emoji: '💎', sub: 'Grands volumes, commande annuelle' },
    ],
  },

];

// ─────────────────────────────────────────────
// MAPPING TRANCHES → VALEURS NUMÉRIQUES
// Pour alimenter ctx.budget_global dans PromptContext
// ─────────────────────────────────────────────

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
 * Retourne les steps dans l'ordre pour un secteur donné
 * avec filtrage dynamique des options par secteur pour le step métier
 */
export function getStepsForContext(secteur: string): QualificationStep[] {
  return QUALIFICATION_STEPS
    .filter(step => !step.condition || step.condition({ secteur }))
    .map(step => {
      // Filtrer les options du step métier par secteur
      if (step.id === 'metier') {
        return {
          ...step,
          options: step.options.filter(
            o => !(o as any).condition_secteur || (o as any).condition_secteur === secteur
          ),
        };
      }
      return step;
    });
}

/**
 * Convertit le contexte de qualification en PromptContext partiel
 * pour alimenter buildSystemPrompt()
 */
export function qualificationToPromptContext(ctx: QualificationContext) {
  return {
    secteur: ctx.secteur,
    metier: ctx.metier,
    style: ctx.style,
    usage: environnementToUsage(ctx.environnement),
    budget_global: ctx.a_budget
      ? (ctx.budget_global ?? BUDGET_TRANCHE_MAP[ctx.budget_tranche ?? ''] ?? undefined)
      : undefined,
    // nb_personnes: à récupérer du calculateur ou d'une question chat
  };
}

/**
 * Mappe l'environnement sur le champ usage du PromptContext
 */
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
 * avant que Claude prenne la main — optionnel mais recommandé
 */
export function buildQualificationSummary(ctx: QualificationContext): string {
  const lignes = [
    `**Secteur :** ${ctx.secteur}`,
    ctx.metier ? `**Métier :** ${ctx.metier}` : null,
    ctx.environnement ? `**Environnement :** ${ctx.environnement}` : null,
    ctx.style ? `**Style :** ${ctx.style}` : null,
    ctx.repartition_hf ? `**Équipe :** ${ctx.repartition_hf}` : null,
    ctx.couleur ? `**Couleur(s) :** ${Array.isArray(ctx.couleur) ? ctx.couleur.join(', ') : ctx.couleur}` : null,
    ctx.delai ? `**Délai :** ${ctx.delai}` : null,
    ctx.a_budget
      ? `**Budget :** ${ctx.budget_tranche ?? 'défini'}`
      : `**Budget :** meilleur rapport Q/P`,
  ].filter(Boolean);

  return lignes.join('\n');
}
