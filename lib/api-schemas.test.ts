import { describe, expect, it } from 'vitest';

import {
  MAX_BULK_IDS,
  MAX_BULK_INSERT,
  bulkCreateTransactionsSchema,
  bulkIdsSchema,
  createAccountSchema,
  createTransactionSchema,
  dateRangeQuerySchema,
} from './api-schemas';

describe('createAccountSchema', () => {
  it('trims whitespace and requires a non-empty name', () => {
    expect(createAccountSchema.parse({ name: '  Aurex Checking  ' })).toEqual({
      name: 'Aurex Checking',
    });
    expect(() => createAccountSchema.parse({ name: '   ' })).toThrow();
    expect(() => createAccountSchema.parse({ name: '' })).toThrow();
  });

  it('rejects names beyond the documented length cap', () => {
    expect(() => createAccountSchema.parse({ name: 'A'.repeat(121) })).toThrow();
    expect(() => createAccountSchema.parse({ name: 'A'.repeat(120) })).not.toThrow();
  });
});

describe('createTransactionSchema', () => {
  const valid = {
    amount: -1500,
    payee: 'Coffee Shop',
    notes: null,
    date: '2026-04-30T12:00:00.000Z',
    accountId: 'acct_1',
    categoryId: null,
  };

  it('accepts a well-formed payload and coerces the date string', () => {
    const parsed = createTransactionSchema.parse(valid);
    expect(parsed.amount).toBe(-1500);
    expect(parsed.payee).toBe('Coffee Shop');
    expect(parsed.date).toBeInstanceOf(Date);
    expect(parsed.date.toISOString()).toBe('2026-04-30T12:00:00.000Z');
  });

  it('requires an integer amount within bounds', () => {
    expect(() => createTransactionSchema.parse({ ...valid, amount: 1.5 })).toThrow();
    expect(() =>
      createTransactionSchema.parse({ ...valid, amount: 2_000_000_000_000 }),
    ).toThrow();
  });

  it('rejects empty or whitespace-only payee strings', () => {
    expect(() => createTransactionSchema.parse({ ...valid, payee: '   ' })).toThrow();
    expect(() => createTransactionSchema.parse({ ...valid, payee: '' })).toThrow();
  });

  it('rejects oversize notes', () => {
    expect(() =>
      createTransactionSchema.parse({ ...valid, notes: 'x'.repeat(2001) }),
    ).toThrow();
    expect(() =>
      createTransactionSchema.parse({ ...valid, notes: 'x'.repeat(2000) }),
    ).not.toThrow();
  });

  it('rejects an unparseable date', () => {
    expect(() => createTransactionSchema.parse({ ...valid, date: 'not-a-date' })).toThrow();
  });
});

describe('bulkIdsSchema', () => {
  it('rejects empty arrays', () => {
    expect(() => bulkIdsSchema.parse({ ids: [] })).toThrow();
  });

  it('rejects arrays beyond MAX_BULK_IDS', () => {
    const ids = Array.from({ length: MAX_BULK_IDS + 1 }, (_, i) => `id_${i}`);
    expect(() => bulkIdsSchema.parse({ ids })).toThrow();
  });

  it('accepts arrays at the cap', () => {
    const ids = Array.from({ length: MAX_BULK_IDS }, (_, i) => `id_${i}`);
    expect(() => bulkIdsSchema.parse({ ids })).not.toThrow();
  });
});

describe('bulkCreateTransactionsSchema', () => {
  const row = {
    amount: -100,
    payee: 'Test',
    notes: null,
    date: '2026-04-30T12:00:00.000Z',
    accountId: 'acct_1',
    categoryId: null,
  };

  it('rejects an empty batch', () => {
    expect(() => bulkCreateTransactionsSchema.parse([])).toThrow();
  });

  it('rejects a batch beyond the cap', () => {
    const rows = Array.from({ length: MAX_BULK_INSERT + 1 }, () => row);
    expect(() => bulkCreateTransactionsSchema.parse(rows)).toThrow();
  });
});

describe('dateRangeQuerySchema', () => {
  it('accepts well-formed YYYY-MM-DD values', () => {
    expect(
      dateRangeQuerySchema.parse({ from: '2026-04-01', to: '2026-04-30' }),
    ).toEqual({ from: '2026-04-01', to: '2026-04-30' });
  });

  it('rejects bad date shapes', () => {
    expect(() => dateRangeQuerySchema.parse({ from: '2026/04/01' })).toThrow();
    expect(() => dateRangeQuerySchema.parse({ from: 'tomorrow' })).toThrow();
  });

  it('rejects from > to', () => {
    expect(() =>
      dateRangeQuerySchema.parse({ from: '2026-05-01', to: '2026-04-01' }),
    ).toThrow();
  });

  it('allows omitting from and/or to', () => {
    expect(() => dateRangeQuerySchema.parse({})).not.toThrow();
    expect(() => dateRangeQuerySchema.parse({ accountId: 'acct_1' })).not.toThrow();
  });
});
