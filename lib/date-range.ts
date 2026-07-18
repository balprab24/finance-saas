import { addDays, addMonths, format, parse, startOfMonth, subDays } from 'date-fns';

export function parseRange(
  from: string | undefined,
  to: string | undefined,
  defaultDays = 30,
): { start: Date; endExclusive: Date } {
  const now = new Date();
  const start = from ? parse(from, 'yyyy-MM-dd', new Date()) : subDays(now, defaultDays);
  const endExclusive = to ? addDays(parse(to, 'yyyy-MM-dd', new Date()), 1) : now;
  return { start, endExclusive };
}

// Bound a [start, endExclusive) window to at most maxDays by moving start forward.
// Keeps the newest portion of an oversized request instead of rejecting it, so
// callers get a silently capped response rather than a 400.
export function clampRangeSpan(
  start: Date,
  endExclusive: Date,
  maxDays: number,
): { start: Date; endExclusive: Date } {
  const floor = subDays(endExclusive, maxDays);
  return { start: start < floor ? floor : start, endExclusive };
}

// Resolve a `YYYY-MM` month string (defaulting to the current month) to a
// [start, endExclusive) window and a normalized first-of-month key for storage.
export function parseMonth(
  month: string | undefined,
): { start: Date; endExclusive: Date; monthKey: string } {
  const base = month ? parse(month, 'yyyy-MM', new Date()) : new Date();
  const start = startOfMonth(base);
  const endExclusive = addMonths(start, 1);
  return { start, endExclusive, monthKey: format(start, 'yyyy-MM-dd') };
}
