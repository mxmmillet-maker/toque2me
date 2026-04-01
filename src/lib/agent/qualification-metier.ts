// qualification-metier.ts
// Étape métier conditionnelle — à insérer dans le flow de qualification du chat
// Déclenché UNIQUEMENT pour les secteurs où les normes divergent par métier

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface MetierOption {
  value: string;
  label: string;
  emoji: string;
  normes_critiques: string[];  // affiché sous le bouton comme sous-texte
  alerte?: string;             // affiché en rouge si norme dure
}

export interface MetierStep {
  question: string;
  sous_titre?: string;
  options: MetierOption[];
}

// ─────────────────────────────────────────────
// DONNÉES PAR SECTEUR
// Seuls les secteurs avec divergence normative
// significative ont une étape métier
// ─────────────────────────────────────────────

export const METIER_STEPS: Record<string, MetierStep> = {

  btp: {
    question: 'Quel(s) métier(s) dans votre équipe ?',
    sous_titre: 'Les normes EPI varient selon le poste — cette info est obligatoire pour garantir la conformité.',
    options: [
      {
        value: 'macon',
        label: 'Maçon / Gros œuvre',
        emoji: '🧱',
        normes_critiques: ['EN ISO 20345 S3', 'EN 14404 genoux'],
      },
      {
        value: 'electricien',
        label: 'Électricien',
        emoji: '⚡',
        normes_critiques: ['EN IEC 61482-2', 'EN 1149'],
        alerte: 'Norme arc électrique obligatoire — tissu spécifique requis',
      },
      {
        value: 'peintre',
        label: 'Peintre / Façadier',
        emoji: '🖌️',
        normes_critiques: ['EN 13034 Type 6', 'EN ISO 20471'],
      },
      {
        value: 'plombier',
        label: 'Plombier / Chauffagiste',
        emoji: '🔧',
        normes_critiques: ['EN ISO 20345 S2', 'EN 374 gants'],
      },
      {
        value: 'conducteur_engins',
        label: 'Conducteur d\'engins',
        emoji: '🚜',
        normes_critiques: ['EN ISO 20471 Classe 3'],
        alerte: 'Haute visibilité classe 3 obligatoire',
      },
      {
        value: 'mixte_btp',
        label: 'Mixte / Plusieurs métiers',
        emoji: '👷',
        normes_critiques: ['Normes les plus restrictives appliquées'],
      },
    ],
  },

  industrie: {
    question: 'Quel type de poste ?',
    sous_titre: 'Les protections varient selon l\'environnement de travail.',
    options: [
      {
        value: 'operateur_chaine',
        label: 'Opérateur de production',
        emoji: '🏭',
        normes_critiques: ['EN 340', 'EN ISO 20345'],
      },
      {
        value: 'soudeur',
        label: 'Soudeur',
        emoji: '🔥',
        normes_critiques: ['EN ISO 11611', 'EN ISO 11612'],
        alerte: '100% coton ou FR traité — synthétique interdit',
      },
      {
        value: 'logisticien',
        label: 'Logisticien / Cariste',
        emoji: '📦',
        normes_critiques: ['EN ISO 20471 Cl.2'],
      },
      {
        value: 'chimiste',
        label: 'Chimie / Laboratoire',
        emoji: '🧪',
        normes_critiques: ['EN 13034 Type 6', 'EN 374'],
      },
      {
        value: 'mixte_industrie',
        label: 'Mixte / Plusieurs postes',
        emoji: '⚙️',
        normes_critiques: ['Normes les plus restrictives appliquées'],
      },
    ],
  },

  // Restauration : déjà différencié par type_etablissement dans le flow
  // entreprise : pas de norme EPI sectorielle → pas d'étape métier
  // association : idem
};

// ─────────────────────────────────────────────
// FONCTIONS UTILITAIRES
// ─────────────────────────────────────────────

/**
 * Indique si une étape métier doit être affichée pour ce secteur
 */
export function needsMetierStep(secteur: string): boolean {
  return secteur in METIER_STEPS;
}

/**
 * Retourne la config de l'étape métier pour un secteur donné
 */
export function getMetierStep(secteur: string): MetierStep | null {
  return METIER_STEPS[secteur] ?? null;
}

/**
 * Retourne le label d'une option métier (pour affichage dans le contexte chat)
 */
export function getMetierLabel(secteur: string, metier: string): string {
  const step = METIER_STEPS[secteur];
  if (!step) return metier;
  return step.options.find(o => o.value === metier)?.label ?? metier;
}

/**
 * Retourne l'alerte normative à afficher si le métier a une norme dure
 * → Peut être utilisé pour afficher un bandeau rouge dans le chat
 */
export function getMetierAlerte(secteur: string, metier: string): string | null {
  const step = METIER_STEPS[secteur];
  if (!step) return null;
  return step.options.find(o => o.value === metier)?.alerte ?? null;
}
