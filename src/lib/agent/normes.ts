// Normes réglementaires codifiées en DUR — pas de hallucination possible
// Si un secteur a des normes OBLIGATOIRES, tout produit sans ces normes est éliminé

export const NORMES_PAR_SECTEUR: Record<string, { normes: string[]; label: string }> = {
  electricien: {
    normes: ['EN1149-5'],
    label: 'Protection antistatique (EN 1149-5) obligatoire',
  },
  restaurateur: {
    normes: ['HACCP'],
    label: 'Conformité HACCP obligatoire',
  },
  traiteur: {
    normes: ['HACCP'],
    label: 'Conformité HACCP obligatoire',
  },
  hotelier: {
    normes: [],
    label: '',
  },
  btp: {
    normes: ['EN-ISO-20471'],
    label: 'Haute visibilité (EN ISO 20471 classe 2 min.) obligatoire',
  },
  chantier: {
    normes: ['EN-ISO-20471'],
    label: 'Haute visibilité (EN ISO 20471) obligatoire',
  },
  soudeur: {
    normes: ['EN-ISO-11612'],
    label: 'Protection chaleur/flammes (EN ISO 11612) obligatoire',
  },
  logistique: {
    normes: ['EN-ISO-20471'],
    label: 'Haute visibilité (EN ISO 20471) obligatoire',
  },
  entreprise: { normes: [], label: '' },
  association: { normes: [], label: '' },
};

export function getNormesRequises(secteur: string): string[] {
  return NORMES_PAR_SECTEUR[secteur]?.normes ?? [];
}

export function getNormeLabel(secteur: string): string {
  return NORMES_PAR_SECTEUR[secteur]?.label ?? '';
}
