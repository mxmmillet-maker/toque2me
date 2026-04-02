// ─── Feasibility Engine ─────────────────────────────────────────────────────
// Calculates whether products + marking techniques can be delivered before
// a given deadline, using business days only (Mon-Fri).
// ─────────────────────────────────────────────────────────────────────────────

/** Buffer for shipping after production */
const DELIVERY_DAYS = 2;
/** Buffer for client validation (BAT) before production starts */
const VALIDATION_DAYS = 2;

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface FeasibilityResult {
  joursDisponibles: number;
  dateButoir: Date;        // last date production can start
  isFeasible: boolean;
  warning?: 'confortable' | 'serre' | 'impossible';
}

export interface TechniqueFeasibility {
  technique: string;
  position: string;
  delai_jours: number;
  feasible: boolean;
  joursRestants: number;
}

// ─── Business days ──────────────────────────────────────────────────────────

/**
 * Count business days between two dates (exclusive of start, inclusive of end).
 * Returns 0 if end <= start.
 */
export function businessDaysBetween(start: Date, end: Date): number {
  // Normalize to midnight UTC to avoid timezone drift
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  if (e <= s) return 0;

  let count = 0;
  const cursor = new Date(s);
  cursor.setDate(cursor.getDate() + 1); // start is exclusive

  while (cursor <= e) {
    const day = cursor.getDay(); // 0=Sun, 6=Sat
    if (day !== 0 && day !== 6) count++;
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
}

/**
 * Subtract N business days from a date. Returns a new Date.
 */
function subtractBusinessDays(date: Date, days: number): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  let remaining = days;
  while (remaining > 0) {
    result.setDate(result.getDate() - 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) remaining--;
  }
  return result;
}

// ─── Core functions ─────────────────────────────────────────────────────────

/**
 * Compute the time window available for production + marking.
 *
 * Available business days = businessDays(today, deadline) - DELIVERY_DAYS - VALIDATION_DAYS
 * dateButoir = deadline minus DELIVERY_DAYS business days (last day production can ship)
 */
export function computeTimeWindow(deadline: Date | string): FeasibilityResult {
  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
  const today = new Date();

  // Normalize both to midnight
  const todayNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const deadlineNorm = new Date(
    deadlineDate.getFullYear(),
    deadlineDate.getMonth(),
    deadlineDate.getDate()
  );

  const totalBusinessDays = businessDaysBetween(todayNorm, deadlineNorm);
  const joursDisponibles = Math.max(0, totalBusinessDays - DELIVERY_DAYS - VALIDATION_DAYS);

  // dateButoir = deadline minus DELIVERY_DAYS business days
  const dateButoir = subtractBusinessDays(deadlineNorm, DELIVERY_DAYS);

  const isFeasible = joursDisponibles > 0;
  const warning = joursDisponibles <= 0
    ? 'impossible' as const
    : joursDisponibles <= 4
      ? 'serre' as const
      : 'confortable' as const;

  return {
    joursDisponibles,
    dateButoir,
    isFeasible,
    warning,
  };
}

/**
 * Check if a product's production delay fits within available days.
 * If delaiProdJours is null, we assume 0 (stock item, ships immediately).
 */
export function isProductFeasible(
  delaiProdJours: number | null,
  joursDisponibles: number
): boolean {
  const delai = delaiProdJours ?? 0;
  return delai <= joursDisponibles;
}

/**
 * Classify how tight the timeline is for a given product.
 *   confortable = 5+ jours de marge
 *   serre       = 1-4 jours de marge
 *   impossible  = 0 ou negatif
 */
export function getProductWarning(
  delaiProdJours: number | null,
  joursDisponibles: number
): 'confortable' | 'serre' | 'impossible' {
  const delai = delaiProdJours ?? 0;
  const marge = joursDisponibles - delai;

  if (marge <= 0) return 'impossible';
  if (marge <= 4) return 'serre';
  return 'confortable';
}

/**
 * Given a product's available marking techniques, production delay, and
 * the marking_pricing rows, return feasibility for each technique+position.
 *
 * Total delay for a technique = product production delay + technique delay.
 * A technique is feasible if total delay <= joursDisponibles.
 */
export function getFeasibleTechniques(
  marquageDispo: string[],
  delaiProdJours: number,
  joursDisponibles: number,
  markingPricing: { technique: string; position: string; delai_jours: number }[]
): TechniqueFeasibility[] {
  // Normalise available techniques to lowercase for matching
  const dispoSet = new Set(marquageDispo.map((t) => t.toLowerCase()));

  // Deduplicate by technique+position (take the min delai if multiple rows)
  const techMap = new Map<string, { technique: string; position: string; delai_jours: number }>();
  for (const row of markingPricing) {
    const key = `${row.technique.toLowerCase()}|${row.position.toLowerCase()}`;
    const existing = techMap.get(key);
    if (!existing || row.delai_jours < existing.delai_jours) {
      techMap.set(key, {
        technique: row.technique,
        position: row.position,
        delai_jours: row.delai_jours,
      });
    }
  }

  const results: TechniqueFeasibility[] = [];

  const entries = Array.from(techMap.values());
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    // Only consider techniques the product supports
    if (!dispoSet.has(entry.technique.toLowerCase())) continue;

    const totalDelai = delaiProdJours + entry.delai_jours;
    const joursRestants = joursDisponibles - totalDelai;
    const feasible = joursRestants >= 0;

    results.push({
      technique: entry.technique,
      position: entry.position,
      delai_jours: entry.delai_jours,
      feasible,
      joursRestants,
    });
  }

  // Sort: feasible first, then by most margin
  results.sort((a, b) => {
    if (a.feasible !== b.feasible) return a.feasible ? -1 : 1;
    return b.joursRestants - a.joursRestants;
  });

  return results;
}
