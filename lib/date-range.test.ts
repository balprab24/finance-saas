import { describe, expect, it } from 'vitest';

import { parseRange } from './date-range';

describe('parseRange', () => {
  it('treats `to` as inclusive by returning an exclusive next-day boundary', () => {
    const { start, endExclusive } = parseRange('2026-04-01', '2026-04-30');
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(3);
    expect(start.getDate()).toBe(1);
    expect(start.getHours()).toBe(0);
    expect(endExclusive.getFullYear()).toBe(2026);
    expect(endExclusive.getMonth()).toBe(4);
    expect(endExclusive.getDate()).toBe(1);
    expect(endExclusive.getHours()).toBe(0);
  });

  it('falls back to a 30-day window when both args are undefined', () => {
    const before = Date.now();
    const { start, endExclusive } = parseRange(undefined, undefined);
    const after = Date.now();
    expect(endExclusive.getTime()).toBeGreaterThanOrEqual(before);
    expect(endExclusive.getTime()).toBeLessThanOrEqual(after);
    const spanMs = endExclusive.getTime() - start.getTime();
    expect(Math.round(spanMs / (1000 * 60 * 60 * 24))).toBe(30);
  });

  it('includes a transaction stored late on the `to` day', () => {
    const { start, endExclusive } = parseRange('2026-04-01', '2026-04-30');
    const lateTx = new Date('2026-04-30T23:30:00Z');
    expect(start.getTime() <= lateTx.getTime()).toBe(true);
    expect(lateTx.getTime() < endExclusive.getTime()).toBe(true);
  });
});
