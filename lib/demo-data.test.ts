import { describe, expect, it } from 'vitest';

import { buildDemoWorkspace } from './demo-data';
import { convertAmountToMiliunits } from './utils';

describe('buildDemoWorkspace', () => {
  const data = buildDemoWorkspace('user_alice', {
    endDate: new Date('2026-04-30T12:00:00.000Z'),
  });

  it('stores amounts in milliunits', () => {
    const payroll = data.transactions.find((transaction) =>
      transaction.payee.includes('Payroll'),
    );

    expect(payroll?.amount).toBe(convertAmountToMiliunits(4200));
  });

  it('generates transactions that reference seeded accounts and categories', () => {
    const accountIds = new Set(data.accounts.map((account) => account.id));
    const categoryIds = new Set(data.categories.map((category) => category.id));

    expect(data.transactions.length).toBeGreaterThan(0);
    expect(data.transactions.every((transaction) => accountIds.has(transaction.accountId))).toBe(
      true,
    );
    expect(
      data.transactions.every(
        (transaction) =>
          transaction.categoryId === null || categoryIds.has(transaction.categoryId),
      ),
    ).toBe(true);
  });

  it('includes both income and expenses', () => {
    expect(data.transactions.some((transaction) => transaction.amount > 0)).toBe(true);
    expect(data.transactions.some((transaction) => transaction.amount < 0)).toBe(true);
  });
});
