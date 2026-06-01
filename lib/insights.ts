// Pure helpers for the spending-insights route. Kept framework-free and free of
// any DB access so the thresholds are easy to unit-test and tune in one place.

export type UnusualOptions = {
  // Current spend must be at least this multiple of the trailing average to flag.
  multiple?: number;
  // Noise floor (milliunits): suppress tiny categories and tiny absolute spikes.
  floorMilliunits?: number;
};

export type UnusualResult = {
  flagged: boolean;
  isNew: boolean;
  // Current / trailingAvg, rounded to 2dp. 0 when there is no trailing history.
  multiple: number;
};

const DEFAULT_MULTIPLE = 1.5;
const DEFAULT_FLOOR = 20_000; // $20 in milliunits

// Flags a category whose current-month spend is unusually high versus its recent
// trailing average. All amounts are positive milliunit spend totals.
export function flagUnusual(
  current: number,
  trailingAvg: number,
  opts: UnusualOptions = {},
): UnusualResult {
  const multiple = opts.multiple ?? DEFAULT_MULTIPLE;
  const floor = opts.floorMilliunits ?? DEFAULT_FLOOR;

  // Ignore categories that are trivially small this month.
  if (current < floor) return { flagged: false, isNew: false, multiple: 0 };

  // No trailing history: brand-new spending this month.
  if (trailingAvg <= 0) return { flagged: true, isNew: true, multiple: 0 };

  const ratio = current / trailingAvg;
  const flagged = ratio >= multiple && current - trailingAvg >= floor;
  return { flagged, isNew: false, multiple: Math.round(ratio * 100) / 100 };
}
