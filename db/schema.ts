import { z } from 'zod';
import {
  pgTable,
  text,
  bigint,
  boolean,
  integer,
  timestamp,
  index,
  uniqueIndex,
  unique,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { relations, sql } from 'drizzle-orm';

export const plaidItems = pgTable(
  'plaid_items',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    plaidItemId: text('plaid_item_id').notNull(),
    accessToken: text('access_token').notNull(),
    institutionId: text('institution_id'),
    institutionName: text('institution_name'),
    cursor: text('cursor'),
    status: text('status').notNull().default('active'),
    lastSyncedAt: timestamp('last_synced_at', { mode: 'date' }),
    lastWebhookAt: timestamp('last_webhook_at', { mode: 'date' }),
    errorCode: text('error_code'),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    index('plaid_items_user_id_idx').on(table.userId),
    uniqueIndex('plaid_items_plaid_item_id_uq').on(table.plaidItemId),
    unique('plaid_items_id_user_id_key').on(table.id, table.userId),
  ],
);

export const plaidItemsRelations = relations(plaidItems, ({ many }) => ({
  accounts: many(accounts),
  syncJobs: many(plaidSyncJobs),
}));

export const plaidSyncJobs = pgTable(
  'plaid_sync_jobs',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    itemId: text('item_id').notNull(),
    reason: text('reason').notNull().default('manual'),
    status: text('status').notNull().default('queued'),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
    startedAt: timestamp('started_at', { mode: 'date' }),
    finishedAt: timestamp('finished_at', { mode: 'date' }),
  },
  (table) => [
    index('plaid_sync_jobs_user_status_idx').on(table.userId, table.status),
    index('plaid_sync_jobs_item_idx').on(table.itemId),
    uniqueIndex('plaid_sync_jobs_active_item_uq')
      .on(table.userId, table.itemId)
      .where(sql`${table.status} in ('queued', 'running')`),
    foreignKey({
      name: 'plaid_sync_jobs_item_user_fk',
      columns: [table.itemId, table.userId],
      foreignColumns: [plaidItems.id, plaidItems.userId],
    }).onDelete('cascade'),
  ],
);

export const plaidSyncJobsRelations = relations(plaidSyncJobs, ({ one }) => ({
  item: one(plaidItems, {
    fields: [plaidSyncJobs.itemId],
    references: [plaidItems.id],
  }),
}));

export const accounts = pgTable(
  'accounts',
  {
    id: text('id').primaryKey(),
    plaidId: text('plaid_id'),
    // DB migration 0005 adds a composite tenant FK with
    // `ON DELETE SET NULL (plaid_item_id)`, which drizzle-kit cannot model.
    plaidItemId: text('plaid_item_id'),
    name: text('name').notNull(),
    userId: text('user_id').notNull(),
    archivedAt: timestamp('archived_at', { mode: 'date' }),
  },
  (table) => [
    index('accounts_user_id_idx').on(table.userId),
    index('accounts_user_archived_idx').on(table.userId, table.archivedAt),
    uniqueIndex('accounts_user_id_name_uq').on(table.userId, sql`lower(${table.name})`),
    uniqueIndex('accounts_user_plaid_id_uq')
      .on(table.userId, table.plaidId)
      .where(sql`${table.plaidId} is not null`),
    unique('accounts_id_user_id_key').on(table.id, table.userId),
  ],
);

export const accountsRelations = relations(accounts, ({ many, one }) => ({
  plaidItem: one(plaidItems, {
    fields: [accounts.plaidItemId],
    references: [plaidItems.id],
  }),
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
    plaidId: text('plaid_id'),
    pendingPlaidId: text('pending_plaid_id'),
    plaidAccountId: text('plaid_account_id'),
    payee: text('payee').notNull(),
    merchantName: text('merchant_name'),
    paymentChannel: text('payment_channel'),
    notes: text('notes'),
    date: timestamp('date', { mode: 'date' }).notNull(),
    userId: text('user_id').notNull(),
    accountId: text('account_id').notNull(),
    categoryId: text('category_id'),
    pending: boolean('pending').notNull().default(false),
  },
  (table) => [
    index('transactions_user_id_idx').on(table.userId),
    index('transactions_account_id_idx').on(table.accountId),
    index('transactions_category_id_idx').on(table.categoryId),
    index('transactions_user_date_idx').on(table.userId, table.date),
    index('transactions_account_date_idx').on(table.accountId, table.date),
    index('transactions_user_plaid_id_idx').on(table.userId, table.plaidId),
    index('transactions_user_plaid_account_id_idx').on(table.userId, table.plaidAccountId),
    uniqueIndex('transactions_user_plaid_id_uq')
      .on(table.userId, table.plaidId)
      .where(sql`${table.plaidId} is not null`),
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
