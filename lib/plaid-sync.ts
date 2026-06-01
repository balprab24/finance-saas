import type { AccountBase, PlaidApi, RemovedTransaction, Transaction } from 'plaid';
import { and, eq, inArray, sql } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { accounts, plaidItems, transactions } from '@/db/schema';
import { decryptSecret } from '@/lib/server-crypto';
import {
  plaidAccountDisplayName,
  plaidAmountToMilliunits,
  plaidDateToDate,
  plaidTransactionPayee,
} from '@/lib/plaid-normalize';
import { getPlaidClient } from '@/lib/plaid';
import { classifyPlaidFailure } from '@/lib/plaid-error-classification';

type DbLike = Pick<typeof db, 'select' | 'insert' | 'update' | 'delete' | 'execute'>;
type DbWithTransaction = DbLike & {
  transaction?: <T>(callback: (tx: DbLike) => Promise<T>) => Promise<T>;
};

type PlaidClientLike = Pick<PlaidApi, 'transactionsSync'>;
type PlaidItem = typeof plaidItems.$inferSelect;

type SyncOptions = {
  database?: DbWithTransaction;
  plaidClient?: PlaidClientLike;
};

type CollectedUpdates = {
  accounts: AccountBase[];
  added: Transaction[];
  modified: Transaction[];
  removed: RemovedTransaction[];
  nextCursor: string | null;
};

export type PlaidSyncResult = {
  itemId: string;
  accountsCreated: number;
  added: number;
  modified: number;
  removed: number;
  cursor: string | null;
};

export class PlaidItemNotFoundError extends Error {
  constructor() {
    super('Plaid item not found');
  }
}

export function getPlaidErrorDetails(err: unknown) {
  const data =
    err &&
    typeof err === 'object' &&
    'response' in err &&
    (err as { response?: { data?: unknown } }).response?.data;

  const plaidData = data && typeof data === 'object' ? data : undefined;
  const errorCode =
    plaidData && 'error_code' in plaidData
      ? String((plaidData as { error_code?: unknown }).error_code || '')
      : undefined;
  const errorMessage =
    plaidData && 'error_message' in plaidData
      ? String((plaidData as { error_message?: unknown }).error_message || '')
      : err instanceof Error
        ? err.message
        : 'Plaid sync failed';

  return { errorCode, errorMessage };
}

async function withTransaction<T>(
  database: DbWithTransaction,
  callback: (tx: DbLike) => Promise<T>,
) {
  if (typeof database.transaction === 'function') {
    return database.transaction(callback);
  }
  return callback(database);
}

async function acquireItemLock(database: DbLike, itemId: string) {
  // Transaction-scoped advisory lock: serializes concurrent syncs for the same
  // Item (e.g. a webhook-triggered sync racing a manual "Sync linked") so only
  // one advances the cursor at a time. Released automatically when the
  // transaction commits or rolls back.
  await database.execute(sql`select pg_advisory_xact_lock(hashtext(${itemId})::bigint)`);
}

function uniqueAccountName(baseName: string, takenNames: Set<string>) {
  let candidate = baseName || 'Linked account';
  if (!takenNames.has(candidate.toLowerCase())) return candidate;

  for (let i = 2; i < 1000; i += 1) {
    const suffix = ` (${i})`;
    const trimmedBase = baseName.slice(0, Math.max(1, 120 - suffix.length)).trim();
    candidate = `${trimmedBase || 'Linked account'}${suffix}`;
    if (!takenNames.has(candidate.toLowerCase())) return candidate;
  }

  return `${baseName.slice(0, 111).trim()} (${crypto.randomUUID().slice(0, 6)})`;
}

export async function upsertPlaidAccountsForItem({
  database,
  userId,
  itemId,
  institutionName,
  plaidAccounts,
}: {
  database: DbLike;
  userId: string;
  itemId: string;
  institutionName?: string | null;
  plaidAccounts: AccountBase[];
}) {
  const localAccounts = await database
    .select({
      id: accounts.id,
      name: accounts.name,
      plaidId: accounts.plaidId,
      plaidItemId: accounts.plaidItemId,
    })
    .from(accounts)
    .where(eq(accounts.userId, userId));

  const byPlaidId = new Map(
    localAccounts
      .filter((account) => account.plaidId)
      .map((account) => [account.plaidId as string, account]),
  );
  const takenNames = new Set(localAccounts.map((account) => account.name.toLowerCase()));
  const accountIdByPlaidId = new Map<string, string>();
  let created = 0;

  for (const plaidAccount of plaidAccounts) {
    const existing = byPlaidId.get(plaidAccount.account_id);

    if (existing) {
      accountIdByPlaidId.set(plaidAccount.account_id, existing.id);
      if (existing.plaidItemId !== itemId) {
        // Relinking this Plaid account to a (re)connected Item: re-point it and
        // bring it back from any archive left by a prior disconnect. A routine
        // same-Item sync leaves archivedAt untouched so manual archives stick.
        await database
          .update(accounts)
          .set({ plaidItemId: itemId, archivedAt: null })
          .where(and(eq(accounts.userId, userId), eq(accounts.id, existing.id)));
      }
      continue;
    }

    const name = uniqueAccountName(
      plaidAccountDisplayName(plaidAccount, institutionName),
      takenNames,
    );
    const [inserted] = await database
      .insert(accounts)
      .values({
        id: crypto.randomUUID(),
        plaidId: plaidAccount.account_id,
        plaidItemId: itemId,
        name,
        userId,
      })
      .returning({ id: accounts.id, name: accounts.name, plaidId: accounts.plaidId });

    created += 1;
    takenNames.add(inserted.name.toLowerCase());
    byPlaidId.set(plaidAccount.account_id, { ...inserted, plaidItemId: itemId });
    accountIdByPlaidId.set(plaidAccount.account_id, inserted.id);
  }

  return { created, accountIdByPlaidId };
}

async function collectUpdates(
  plaidClient: PlaidClientLike,
  accessToken: string,
  cursor: string | null,
): Promise<CollectedUpdates> {
  const updates: CollectedUpdates = {
    accounts: [],
    added: [],
    modified: [],
    removed: [],
    nextCursor: cursor,
  };

  let nextCursor = cursor || undefined;
  let hasMore = true;

  while (hasMore) {
    const response = await plaidClient.transactionsSync({
      access_token: accessToken,
      cursor: nextCursor,
      count: 500,
      options: { include_original_description: true },
    });
    const data = response.data;

    updates.accounts.push(...data.accounts);
    updates.added.push(...data.added);
    updates.modified.push(...data.modified);
    updates.removed.push(...data.removed);
    updates.nextCursor = data.next_cursor || null;

    nextCursor = data.next_cursor || undefined;
    hasMore = data.has_more;
  }

  return updates;
}

async function collectUpdatesWithRetry(
  plaidClient: PlaidClientLike,
  accessToken: string,
  cursor: string | null,
) {
  try {
    return await collectUpdates(plaidClient, accessToken, cursor);
  } catch (err) {
    const { errorCode } = getPlaidErrorDetails(err);
    if (errorCode === 'TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION') {
      return await collectUpdates(plaidClient, accessToken, cursor);
    }
    throw err;
  }
}

function dedupeAccounts(plaidAccounts: AccountBase[]) {
  const byId = new Map<string, AccountBase>();
  for (const account of plaidAccounts) byId.set(account.account_id, account);
  return Array.from(byId.values());
}

async function resolveAccountId(
  database: DbLike,
  userId: string,
  plaidAccountId: string,
  accountIdByPlaidId: Map<string, string>,
) {
  const mapped = accountIdByPlaidId.get(plaidAccountId);
  if (mapped) return mapped;

  const [account] = await database
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.plaidId, plaidAccountId)));

  if (!account) {
    throw new Error(`Missing local account for Plaid account ${plaidAccountId}`);
  }

  accountIdByPlaidId.set(plaidAccountId, account.id);
  return account.id;
}

function syncedTransactionValues(
  transaction: Transaction,
  userId: string,
  accountId: string,
) {
  return {
    amount: plaidAmountToMilliunits(transaction.amount),
    plaidId: transaction.transaction_id,
    pendingPlaidId: transaction.pending_transaction_id,
    plaidAccountId: transaction.account_id,
    payee: plaidTransactionPayee(transaction),
    merchantName: transaction.merchant_name,
    paymentChannel: transaction.payment_channel,
    date: plaidDateToDate(transaction.date),
    userId,
    accountId,
    pending: transaction.pending,
  };
}

async function upsertSyncedTransaction({
  database,
  transaction,
  userId,
  accountIdByPlaidId,
}: {
  database: DbLike;
  transaction: Transaction;
  userId: string;
  accountIdByPlaidId: Map<string, string>;
}) {
  const accountId = await resolveAccountId(
    database,
    userId,
    transaction.account_id,
    accountIdByPlaidId,
  );
  const values = syncedTransactionValues(transaction, userId, accountId);

  // Atomic upsert on the (user_id, plaid_id) partial unique index. This replaces
  // a select-then-insert that could race when a webhook sync and a manual sync
  // run concurrently (the loser used to hit a unique violation and falsely mark
  // the Item errored). The `set` list intentionally omits `notes` and
  // `categoryId` so user edits survive Plaid updates.
  const [row] = await database
    .insert(transactions)
    .values({
      id: crypto.randomUUID(),
      notes: null,
      categoryId: null,
      ...values,
    })
    .onConflictDoUpdate({
      target: [transactions.userId, transactions.plaidId],
      targetWhere: sql`${transactions.plaidId} is not null`,
      set: {
        amount: values.amount,
        pendingPlaidId: values.pendingPlaidId,
        plaidAccountId: values.plaidAccountId,
        payee: values.payee,
        merchantName: values.merchantName,
        paymentChannel: values.paymentChannel,
        date: values.date,
        accountId: values.accountId,
        pending: values.pending,
      },
    })
    // xmax = 0 marks a freshly inserted row; a non-zero xmax means the conflict
    // path updated an existing row.
    .returning({ inserted: sql<boolean>`(xmax = 0)` });

  return row?.inserted ? ('inserted' as const) : ('updated' as const);
}

async function applyUpdates(database: DbLike, item: PlaidItem, updates: CollectedUpdates) {
  const accountResult = await upsertPlaidAccountsForItem({
    database,
    userId: item.userId,
    itemId: item.id,
    institutionName: item.institutionName,
    plaidAccounts: dedupeAccounts(updates.accounts),
  });

  let added = 0;
  let modified = 0;

  for (const transaction of updates.added) {
    const result = await upsertSyncedTransaction({
      database,
      transaction,
      userId: item.userId,
      accountIdByPlaidId: accountResult.accountIdByPlaidId,
    });
    if (result === 'inserted') added += 1;
    else modified += 1;
  }

  for (const transaction of updates.modified) {
    const result = await upsertSyncedTransaction({
      database,
      transaction,
      userId: item.userId,
      accountIdByPlaidId: accountResult.accountIdByPlaidId,
    });
    if (result === 'inserted') added += 1;
    else modified += 1;
  }

  let removed = 0;
  const removedIds = updates.removed.map((transaction) => transaction.transaction_id);
  if (removedIds.length > 0) {
    const deleted = await database
      .delete(transactions)
      .where(and(eq(transactions.userId, item.userId), inArray(transactions.plaidId, removedIds)))
      .returning({ id: transactions.id });
    removed = deleted.length;
  }

  const now = new Date();
  await database
    .update(plaidItems)
    .set({
      cursor: updates.nextCursor,
      status: 'active',
      lastSyncedAt: now,
      errorCode: null,
      errorMessage: null,
      updatedAt: now,
    })
    .where(and(eq(plaidItems.id, item.id), eq(plaidItems.userId, item.userId)));

  return {
    itemId: item.id,
    accountsCreated: accountResult.created,
    added,
    modified,
    removed,
    cursor: updates.nextCursor,
  };
}

async function markPlaidItemError(database: DbLike, item: PlaidItem, err: unknown) {
  const { errorCode, errorMessage } = getPlaidErrorDetails(err);
  await database
    .update(plaidItems)
    .set({
      status: 'error',
      errorCode: errorCode || null,
      errorMessage: errorMessage.slice(0, 500),
      updatedAt: new Date(),
    })
    .where(and(eq(plaidItems.id, item.id), eq(plaidItems.userId, item.userId)));
}

async function syncPlaidItem(itemId: string, userId: string, options?: SyncOptions) {
  const database = options?.database ?? db;
  const plaidClient = options?.plaidClient ?? getPlaidClient();
  let lockedItem: PlaidItem | null = null;

  try {
    return await withTransaction(database, async (tx) => {
      await acquireItemLock(tx, itemId);
      const [item] = await tx
        .select()
        .from(plaidItems)
        .where(and(eq(plaidItems.id, itemId), eq(plaidItems.userId, userId)));

      if (!item || item.status === 'removed') throw new PlaidItemNotFoundError();
      lockedItem = item;

      const updates = await collectUpdatesWithRetry(
        plaidClient,
        decryptSecret(item.accessToken),
        item.cursor,
      );

      return applyUpdates(tx, item, updates);
    });
  } catch (err) {
    // Only flag the Item for reconnection on genuine item-auth/config errors.
    // Transient failures (rate limits, Plaid 5xx, network blips) are retried by
    // the sync queue and must not tell the user to reconnect a healthy bank.
    if (
      lockedItem &&
      !(err instanceof PlaidItemNotFoundError) &&
      classifyPlaidFailure(err).isItemError
    ) {
      await markPlaidItemError(database, lockedItem, err);
    }
    throw err;
  }
}

export async function syncPlaidItemForUser(
  itemId: string,
  userId: string,
  options?: SyncOptions,
) {
  return await syncPlaidItem(itemId, userId, options);
}

export async function syncPlaidItemByPlaidItemId(plaidItemId: string, options?: SyncOptions) {
  const database = options?.database ?? db;
  const [item] = await database
    .select()
    .from(plaidItems)
    .where(eq(plaidItems.plaidItemId, plaidItemId));

  if (!item) return null;
  if (item.status === 'removed') return null;

  await database
    .update(plaidItems)
    .set({ lastWebhookAt: new Date(), updatedAt: new Date() })
    .where(eq(plaidItems.id, item.id));

  return await syncPlaidItem(item.id, item.userId, options);
}
