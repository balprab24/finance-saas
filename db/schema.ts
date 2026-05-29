import { z } from 'zod';
import {
  pgTable,
  text,
  bigint,
  timestamp,
  index,
  uniqueIndex,
  unique,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { relations, sql } from 'drizzle-orm';

export const accounts = pgTable(
  'accounts',
  {
    id: text('id').primaryKey(),
    plaidId: text('plaid_id'),
    name: text('name').notNull(),
    userId: text('user_id').notNull(),
    archivedAt: timestamp('archived_at', { mode: 'date' }),
  },
  (table) => [
    index('accounts_user_id_idx').on(table.userId),
    index('accounts_user_archived_idx').on(table.userId, table.archivedAt),
    uniqueIndex('accounts_user_id_name_uq').on(table.userId, sql`lower(${table.name})`),
    unique('accounts_id_user_id_key').on(table.id, table.userId),
  ],
);

export const accountsRelations = relations(accounts, ({ many }) => ({
  transactions: many(transactions),
}));

export const insertAccountSchema = createInsertSchema(accounts);

export const categories = pgTable(
  'categories',
  {
    id: text('id').primaryKey(),
    plaidId: text('plaid_id'),
    name: text('name').notNull(),
    userId: text('user_id').notNull(),
  },
  (table) => [
    index('categories_user_id_idx').on(table.userId),
    uniqueIndex('categories_user_id_name_uq').on(table.userId, sql`lower(${table.name})`),
    unique('categories_id_user_id_key').on(table.id, table.userId),
  ],
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
}));

export const insertCategorySchema = createInsertSchema(categories);

export const transactions = pgTable(
  'transactions',
  {
    id: text('id').primaryKey(),
    // Stored as bigint so milliunit amounts up to ±1e12 (see lib/api-schemas.ts)
    // fit without overflow. JS `number` is safe up to 2^53.
    amount: bigint('amount', { mode: 'number' }).notNull(),
    payee: text('payee').notNull(),
    notes: text('notes'),
    date: timestamp('date', { mode: 'date' }).notNull(),
    userId: text('user_id').notNull(),
    accountId: text('account_id').notNull(),
    categoryId: text('category_id'),
  },
  (table) => [
    index('transactions_user_id_idx').on(table.userId),
    index('transactions_account_id_idx').on(table.accountId),
    index('transactions_category_id_idx').on(table.categoryId),
    index('transactions_user_date_idx').on(table.userId, table.date),
    index('transactions_account_date_idx').on(table.accountId, table.date),
    // Composite tenant FKs. Migration drizzle/0004_*.sql is the source of truth:
    // the category FK uses `ON DELETE SET NULL (category_id)` (Postgres 15+) so
    // deleting a category nulls only category_id, not the NOT NULL user_id.
    // drizzle-kit cannot model the column list — if `db:generate` emits a diff
    // for these FKs, discard it.
    foreignKey({
      name: 'transactions_account_user_fk',
      columns: [table.accountId, table.userId],
      foreignColumns: [accounts.id, accounts.userId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'transactions_category_user_fk',
      columns: [table.categoryId, table.userId],
      foreignColumns: [categories.id, categories.userId],
    }).onDelete('set null'),
  ],
);

export const transactionsRelations = relations(transactions, ({ one }) => ({
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

export const insertTransactionSchema = createInsertSchema(transactions, {
  date: z.coerce.date(),
});
