import { addDays, parse, subDays } from 'date-fns';

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
