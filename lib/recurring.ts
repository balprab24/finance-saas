// Pure, framework-free recurring-merchant detection. Operates on plain expense
// rows so it is fully unit-testable and reused by the /insights API route.

const DAY_MS = 1000 * 60 * 60 * 24;

export type Cadence = 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export type RecurringInput = {
  merchantKey: string;
  displayName: string;
  date: Date;
  // Raw transaction amount in milliunits (expenses are negative). abs() is used.
  amount: number;
};

export type RecurringResult = {
  merchantKey: string;
  displayName: string;
  cadence: Cadence;
  typicalAmount: number; // positive milliunits
  occurrences: number;
  lastDate: Date;
  nextExpectedDate: Date;
  monthlyEquivalent: number; // positive milliunits normalized to a monthly figure
};

// Normalized merchant identity: lower(coalesce(merchantName, payee)). Must match
// the SQL expression used to filter the ignore list so the two agree exactly.
export function recurringMerchantKey(
  merchantName: string | null | undefined,
  payee: string | null | undefined,
): string {
  const m = (merchantName ?? '').trim();
  const p = (payee ?? '').trim();
  return (m || p).toLowerCase();
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function mode(values: string[]): string {
  const counts = new Map<string, number>();
  let best = values[0] ?? '';
  let bestCount = 0;
  for (const v of values) {
    const next = (counts.get(v) ?? 0) + 1;
    counts.set(v, next);
    if (next > bestCount) {
      best = v;
      bestCount = next;
    }
  }
  return best;
}

// Maps a median inter-purchase interval (in days) to a cadence, or null.
function classifyCadence(days: number): Cadence | null {
  if (days >= 6 && days <= 8) return 'weekly';
  if (days >= 12 && days <= 16) return 'biweekly';
  if (days >= 26 && days <= 35) return 'monthly';
  if (days >= 330 && days <= 400) return 'yearly';
  return null;
}

const MONTHLY_MULTIPLIER: Record<Cadence, number> = {
  weekly: 52 / 12, // ~4.33
  biweekly: 26 / 12, // ~2.17
  monthly: 1,
  yearly: 1 / 12,
};

const MIN_OCCURRENCES = 3;
const AMOUNT_TOLERANCE = 0.2; // amounts must sit within ±20% of the median
const INTERVAL_CV_MAX = 0.35; // reject irregular spacing (coefficient of variation)

export function detectRecurring(
  rows: RecurringInput[],
  opts: { now?: Date } = {},
): RecurringResult[] {
  const now = opts.now ?? new Date();

  const groups = new Map<string, RecurringInput[]>();
  for (const row of rows) {
    const list = groups.get(row.merchantKey);
    if (list) list.push(row);
    else groups.set(row.merchantKey, [row]);
  }

  const results: RecurringResult[] = [];

  for (const [merchantKey, group] of groups) {
    if (group.length < MIN_OCCURRENCES) continue;

    const sorted = [...group].sort((a, b) => a.date.getTime() - b.date.getTime());

    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i += 1) {
      intervals.push((sorted[i].date.getTime() - sorted[i - 1].date.getTime()) / DAY_MS);
    }
    const medianInterval = median(intervals);
    if (medianInterval <= 0) continue;

    const cadence = classifyCadence(medianInterval);
    if (!cadence) continue;

    // Regularity: intervals must be tightly clustered around the median.
    const meanInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance =
      intervals.reduce((a, b) => a + (b - meanInterval) ** 2, 0) / intervals.length;
    const cv = meanInterval > 0 ? Math.sqrt(variance) / meanInterval : Infinity;
    if (cv > INTERVAL_CV_MAX) continue;

    // Amount stability around the median.
    const amounts = sorted.map((r) => Math.abs(r.amount));
    const medianAmount = median(amounts);
    if (medianAmount <= 0) continue;
    const stable = amounts.every(
      (a) => Math.abs(a - medianAmount) / medianAmount <= AMOUNT_TOLERANCE,
    );
    if (!stable) continue;

    const lastDate = sorted[sorted.length - 1].date;
    const nextExpectedDate = new Date(lastDate.getTime() + Math.round(medianInterval) * DAY_MS);

    // Drop likely-cancelled subscriptions: the next charge is already well overdue.
    if (nextExpectedDate.getTime() < now.getTime() - Math.round(medianInterval) * DAY_MS) {
      continue;
    }

    results.push({
      merchantKey,
      displayName: mode(sorted.map((r) => r.displayName)),
      cadence,
      typicalAmount: Math.round(medianAmount),
      occurrences: group.length,
      lastDate,
      nextExpectedDate,
      monthlyEquivalent: Math.round(medianAmount * MONTHLY_MULTIPLIER[cadence]),
    });
  }

  return results.sort((a, b) => b.monthlyEquivalent - a.monthlyEquivalent);
}
