import { describe, expect, it } from 'vitest';

import { detectRecurring, recurringMerchantKey, type RecurringInput } from './recurring';

const NOW = new Date('2026-06-15T00:00:00Z');

function monthlySeries(
  merchantKey: string,
  displayName: string,
  amount: number,
  months: string[],
): RecurringInput[] {
  return months.map((m) => ({ merchantKey, displayName, date: new Date(m), amount }));
}

describe('recurringMerchantKey', () => {
  it('prefers merchant name, falls back to payee, and normalizes case', () => {
    expect(recurringMerchantKey('  Netflix ', 'NETFLIX.COM')).toBe('netflix');
    expect(recurringMerchantKey(null, '  Spotify ')).toBe('spotify');
    expect(recurringMerchantKey('', 'Hulu')).toBe('hulu');
  });
});

describe('detectRecurring', () => {
  it('detects a stable monthly subscription', () => {
    const rows = monthlySeries('netflix', 'Netflix', -15990, [
      '2026-03-14',
      '2026-04-14',
      '2026-05-14',
      '2026-06-13',
    ]);

    const [result] = detectRecurring(rows, { now: NOW });
    expect(result.merchantKey).toBe('netflix');
    expect(result.cadence).toBe('monthly');
    expect(result.typicalAmount).toBe(15990);
    expect(result.occurrences).toBe(4);
    expect(result.monthlyEquivalent).toBe(15990);
  });

  it('detects a weekly cadence and normalizes the monthly equivalent', () => {
    const rows: RecurringInput[] = [
      { merchantKey: 'coffee', displayName: 'Coffee', date: new Date('2026-05-04'), amount: -5000 },
      { merchantKey: 'coffee', displayName: 'Coffee', date: new Date('2026-05-11'), amount: -5000 },
      { merchantKey: 'coffee', displayName: 'Coffee', date: new Date('2026-05-18'), amount: -5000 },
      { merchantKey: 'coffee', displayName: 'Coffee', date: new Date('2026-05-25'), amount: -5000 },
    ];
    const [result] = detectRecurring(rows, { now: new Date('2026-05-28') });
    expect(result.cadence).toBe('weekly');
    // 5000 * 52/12 ≈ 21667
    expect(result.monthlyEquivalent).toBe(Math.round(5000 * (52 / 12)));
  });

  it('rejects merchants with fewer than three occurrences', () => {
    const rows = monthlySeries('rare', 'Rare', -1000, ['2026-04-01', '2026-05-01']);
    expect(detectRecurring(rows, { now: NOW })).toHaveLength(0);
  });

  it('rejects irregular spacing', () => {
    const rows: RecurringInput[] = [
      { merchantKey: 'x', displayName: 'X', date: new Date('2026-01-01'), amount: -1000 },
      { merchantKey: 'x', displayName: 'X', date: new Date('2026-01-08'), amount: -1000 },
      { merchantKey: 'x', displayName: 'X', date: new Date('2026-04-20'), amount: -1000 },
    ];
    expect(detectRecurring(rows, { now: NOW })).toHaveLength(0);
  });

  it('rejects unstable amounts', () => {
    const rows = monthlySeries('y', 'Y', 0, ['2026-03-10', '2026-04-10', '2026-05-10']).map(
      (r, i) => ({ ...r, amount: [-1000, -9000, -1000][i] }),
    );
    expect(detectRecurring(rows, { now: NOW })).toHaveLength(0);
  });

  it('drops a subscription whose next charge is long overdue (cancelled)', () => {
    const rows = monthlySeries('old', 'Old', -2000, ['2025-09-01', '2025-10-01', '2025-11-01']);
    expect(detectRecurring(rows, { now: NOW })).toHaveLength(0);
  });
});
