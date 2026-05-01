import { addDays, startOfDay, subDays } from 'date-fns';

import type { accounts, categories, transactions } from '../db/schema';
import { convertAmountToMiliunits } from './utils';

type AccountInsert = typeof accounts.$inferInsert;
type CategoryInsert = typeof categories.$inferInsert;
type TransactionInsert = typeof transactions.$inferInsert;

type DemoWorkspace = {
  accounts: AccountInsert[];
  categories: CategoryInsert[];
  transactions: TransactionInsert[];
};

type DemoWorkspaceOptions = {
  endDate?: Date;
};

const DEMO_ACCOUNTS = [
  'Aurex Checking',
  'Aurex Credit Card',
  'High-Yield Savings',
] as const;

const DEMO_CATEGORIES = [
  'Salary',
  'Groceries',
  'Rent',
  'Dining',
  'Transport',
  'Entertainment',
  'Utilities',
  'Subscriptions',
  'Health',
] as const;

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function accountId(seed: string, index: number) {
  return `demo_acct_${seed}_${index}`;
}

function categoryId(seed: string, index: number) {
  return `demo_cat_${seed}_${index}`;
}

function transactionId(seed: string, index: number) {
  return `demo_tx_${seed}_${String(index).padStart(3, '0')}`;
}

function variedAmount(base: number, dayIndex: number, salt: number) {
  const cents = Math.round(base * 100);
  const variation = ((dayIndex * 17 + salt * 31) % 21) - 10;
  return (cents + variation * 37) / 100;
}

export function buildDemoWorkspace(
  userId: string,
  options: DemoWorkspaceOptions = {},
): DemoWorkspace {
  const seed = stableHash(userId);
  const endDate = startOfDay(options.endDate ?? new Date());
  const startDate = subDays(endDate, 74);

  const accountRows = DEMO_ACCOUNTS.map((name, index) => ({
    id: accountId(seed, index),
    name,
    userId,
  }));

  const categoryRows = DEMO_CATEGORIES.map((name, index) => ({
    id: categoryId(seed, index),
    name,
    userId,
  }));

  const categoryByName = Object.fromEntries(categoryRows.map((category) => [category.name, category.id]));
  const checkingId = accountRows[0].id;
  const creditId = accountRows[1].id;
  const savingsId = accountRows[2].id;

  const transactionsRows: TransactionInsert[] = [];

  const pushTransaction = (
    date: Date,
    values: {
      amount: number;
      payee: string;
      accountId: string;
      category: (typeof DEMO_CATEGORIES)[number];
      notes?: string | null;
    },
  ) => {
    transactionsRows.push({
      id: transactionId(seed, transactionsRows.length),
      amount: convertAmountToMiliunits(values.amount),
      payee: values.payee,
      notes: values.notes ?? null,
      date,
      accountId: values.accountId,
      categoryId: categoryByName[values.category] ?? null,
    });
  };

  for (let dayIndex = 0; dayIndex < 75; dayIndex += 1) {
    const date = addDays(startDate, dayIndex);
    const dayOfMonth = date.getDate();

    if (dayIndex % 14 === 2) {
      pushTransaction(date, {
        amount: 4200,
        payee: 'Northstar Studio Payroll',
        accountId: checkingId,
        category: 'Salary',
      });
    }

    if (dayOfMonth === 1) {
      pushTransaction(date, {
        amount: -1850,
        payee: 'Harbor Lofts',
        accountId: checkingId,
        category: 'Rent',
      });
    }

    if (dayOfMonth === 6) {
      pushTransaction(date, {
        amount: -142.84,
        payee: 'Pacific Energy',
        accountId: checkingId,
        category: 'Utilities',
      });
    }

    if (dayOfMonth === 12) {
      pushTransaction(date, {
        amount: 8.37,
        payee: 'Savings Interest',
        accountId: savingsId,
        category: 'Salary',
      });
    }

    if (dayOfMonth === 15) {
      pushTransaction(date, {
        amount: -16.99,
        payee: 'Streamline Plus',
        accountId: creditId,
        category: 'Subscriptions',
      });
    }

    if (dayIndex % 5 === 0) {
      pushTransaction(date, {
        amount: -variedAmount(82, dayIndex, 1),
        payee: dayIndex % 10 === 0 ? 'Whole Market' : 'Trader Point',
        accountId: creditId,
        category: 'Groceries',
      });
    }

    if (dayIndex % 6 === 3) {
      pushTransaction(date, {
        amount: -variedAmount(38, dayIndex, 2),
        payee: dayIndex % 12 === 3 ? 'Juniper Bistro' : 'Blue Bottle Coffee',
        accountId: creditId,
        category: 'Dining',
      });
    }

    if (dayIndex % 9 === 4) {
      pushTransaction(date, {
        amount: -variedAmount(28, dayIndex, 3),
        payee: 'Metro Rides',
        accountId: creditId,
        category: 'Transport',
      });
    }

    if (dayIndex % 17 === 7) {
      pushTransaction(date, {
        amount: -variedAmount(64, dayIndex, 4),
        payee: 'Cinema Social',
        accountId: creditId,
        category: 'Entertainment',
      });
    }

    if (dayIndex % 23 === 11) {
      pushTransaction(date, {
        amount: -variedAmount(47, dayIndex, 5),
        payee: 'City Wellness',
        accountId: creditId,
        category: 'Health',
      });
    }
  }

  return {
    accounts: accountRows,
    categories: categoryRows,
    transactions: transactionsRows,
  };
}
