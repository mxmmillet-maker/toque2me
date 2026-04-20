// ─── Moteur temporel — calcul date de livraison estimée ─────────────────────
//
// Date livraison = aujourd'hui + délai produit + délai marquage + délai livraison
// Tout en jours ouvrés (lun-ven, hors jours fériés FR)

// ── Jours fériés France (fixes + mobiles 2026-2027) ─────────────────────────

const JOURS_FERIES = new Set([
  // 2026
  '2026-01-01', '2026-04-06', '2026-05-01', '2026-05-14', '2026-05-25',
  '2026-07-14', '2026-08-15', '2026-11-01', '2026-11-11', '2026-12-25',
  // 2027
  '2027-01-01', '2027-03-29', '2027-05-01', '2027-05-10', '2027-05-20',
  '2027-07-14', '2027-08-15', '2027-11-01', '2027-11-11', '2027-12-25',
]);

function isBusinessDay(date: Date): boolean {
  const day = date.getDay();
  if (day === 0 || day === 6) return false; // weekend
  const iso = date.toISOString().slice(0, 10);
  return !JOURS_FERIES.has(iso);
}

/**
 * Ajoute N jours ouvrés à une date.
 */
export function addBusinessDays(from: Date, days: number): Date {
  const result = new Date(from);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    if (isBusinessDay(result)) added++;
  }
  return result;
}

/**
 * Compte le nombre de jours ouvrés entre deux dates.
 */
export function businessDaysBetween(from: Date, to: Date): number {
  let count = 0;
  const current = new Date(from);
  while (current < to) {
    current.setDate(current.getDate() + 1);
    if (isBusinessDay(current)) count++;
  }
  return count;
}

// ── Délais par défaut ───────────────────────────────────────────────────────

const DELAI_PROD_PAR_FOURNISSEUR: Record<string, number> = {
  toptex: 2,
  cybernecard: 5,
  makito: 7,
  'bic-graphic': 5,
};

const DELAI_MARQUAGE: Record<string, Record<string, number>> = {
  // Circuit B : TopTex + sous-traitant Siri Ouest
  toptex: {
    serigraphie: 7,
    broderie: 15,
    dtf: 5,
    sans: 0,
  },
  // Circuit A : Cybernecard intégré
  cybernecard: {
    serigraphie: 15,
    broderie: 15,
    dtf: 15,
    sans: 0,
  },
  // Défaut pour les autres fournisseurs
  default: {
    serigraphie: 10,
    broderie: 15,
    dtf: 7,
    sans: 0,
  },
};

const DELAI_LIVRAISON = 1; // 1 jour ouvré (livraison 24h)

// ── API publique ────────────────────────────────────────────────────────────

export interface DeliveryEstimate {
  /** Date estimée de livraison */
  date: Date;
  /** Nombre total de jours ouvrés */
  totalJoursOuvres: number;
  /** Détail des étapes */
  detail: {
    production: number;
    marquage: number;
    livraison: number;
  };
  /** Livrable avant la date cible ? */
  livrableAvant?: boolean;
}

/**
 * Calcule la date de livraison estimée pour un produit.
 */
export function estimateDelivery(
  fournisseur: string,
  technique: string = 'sans',
  fromDate: Date = new Date(),
  delaiProdOverride?: number,
): DeliveryEstimate {
  const production = delaiProdOverride ?? DELAI_PROD_PAR_FOURNISSEUR[fournisseur] ?? 5;
  const marquageTable = DELAI_MARQUAGE[fournisseur] || DELAI_MARQUAGE.default;
  const marquage = marquageTable[technique] ?? marquageTable.sans ?? 0;
  const livraison = DELAI_LIVRAISON;

  const total = production + marquage + livraison;
  const date = addBusinessDays(fromDate, total);

  return {
    date,
    totalJoursOuvres: total,
    detail: { production, marquage, livraison },
  };
}

/**
 * Vérifie si un produit peut être livré avant une date cible.
 */
export function isDeliverableBefore(
  fournisseur: string,
  technique: string,
  targetDate: Date,
  fromDate: Date = new Date(),
  delaiProdOverride?: number,
): boolean {
  const estimate = estimateDelivery(fournisseur, technique, fromDate, delaiProdOverride);
  return estimate.date <= targetDate;
}

/**
 * Formate une date de livraison en texte lisible.
 * Ex: "Livrable le mar. 6 mai" ou "Livrable sous 4 jours ouvrés"
 */
export function formatDeliveryDate(estimate: DeliveryEstimate): string {
  const now = new Date();
  const jours = estimate.totalJoursOuvres;

  if (jours <= 3) {
    return `Livrable sous ${jours}j ouvré${jours > 1 ? 's' : ''}`;
  }

  const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'long' };
  return `Livrable le ${estimate.date.toLocaleDateString('fr-FR', options)}`;
}

/**
 * Texte court pour badge catalogue.
 * Ex: "3j" ou "2 sem."
 */
export function deliveryBadgeText(totalJoursOuvres: number): string {
  if (totalJoursOuvres <= 5) return `${totalJoursOuvres}j`;
  const weeks = Math.ceil(totalJoursOuvres / 5);
  return `${weeks} sem.`;
}
