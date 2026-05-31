import { describe, expect, it } from 'vitest';

import { plaidAmountToMilliunits, plaidDateToDate } from '@/lib/plaid-normalize';

describe('Plaid normalization helpers', () => {
  it('converts Plaid outflows to negative Aurex milliunits', () => {
    expect(plaidAmountToMilliunits(12.34)).toBe(-12340);
  });

  it('converts Plaid inflows to positive Aurex milliunits', () => {
    expect(plaidAmountToMilliunits(-100)).toBe(100000);
  });

  it('normalizes Plaid calendar dates without shifting the day', () => {
    const date = plaidDateToDate('2026-05-31');
    expect(date.toISOString()).toBe('2026-05-31T12:00:00.000Z');
  });
});
