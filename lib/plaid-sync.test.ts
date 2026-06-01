import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';

import { accounts, plaidItems, transactions } from '@/db/schema';

// The real Postgres client throws at import time without DATABASE_URL, and these
// tests inject their own fake database, so the default export is never used.
vi.mock('@/db/drizzle', () => ({ db: {} }));

// Access tokens are stored encrypted; decryption is exercised by
// lib/server-crypto.test.ts, so here we treat it as identity to keep fixtures legible.
vi.mock('@/lib/server-crypto', () => ({
  encryptSecret: (value: string) => value,
  decryptSecret: (value: string) => value,
}));

import { syncPlaidItemForUser } from '@/lib/plaid-sync';

type Row = Record<string, unknown>;

type Capture = {
  inserts: { table: string; values: Row }[];
  upserts: { table: string; values: Row; set: Row }[];
  updates: { table: string; values: Row }[];
  deletes: { table: string; condition: SQL }[];
  locks: unknown[];
  events: string[];
};

type RunConfig = {
  selectQueue: Row[][];
  // Drives the (xmax = 0) "inserted" flag returned by each transaction upsert,
  // in call order. Defaults to `true` (inserted) when the queue is exhausted.
  insertedFlags?: boolean[];
  deletedReturning?: Row[];
};

const PLAID_ITEM = {
  id: 'item_local_1',
  userId: 'user_alice',
  plaidItemId: 'plaid_item_1',
  accessToken: 'access-test',
  institutionId: 'ins_1',
  institutionName: 'First Test Bank',
  cursor: null as string | null,
  status: 'active',
  lastSyncedAt: null,
  lastWebhookAt: null,
  errorCode: null,
  errorMessage: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const LOCAL_ACCOUNT = {
  id: 'acct_local_1',
  name: 'First Test Bank Checking 0000',
  plaidId: 'a1',
  plaidItemId: PLAID_ITEM.id,
};

function plaidAccount(accountId: string) {
  return {
    account_id: accountId,
    name: 'Checking',
    official_name: null,
    mask: '0000',
    type: 'depository',
    subtype: 'checking',
    balances: { available: 100, current: 100, iso_currency_code: 'USD' },
  };
}

function plaidTransaction(overrides: Row) {
  return {
    transaction_id: 'txn_p_1',
    account_id: 'a1',
    amount: 12.34,
    date: '2026-05-01',
    name: 'Coffee Bar',
    merchant_name: 'Blue Bottle',
    payment_channel: 'in store',
    pending: false,
    pending_transaction_id: null,
    ...overrides,
  };
}

function syncPage(overrides: Row) {
  return {
    data: {
      accounts: [plaidAccount('a1')],
      added: [],
      modified: [],
      removed: [],
      has_more: false,
      next_cursor: 'cursor-next',
      ...overrides,
    },
  };
}

function tableName(table: unknown) {
  if (table === accounts) return 'accounts';
  if (table === plaidItems) return 'plaidItems';
  if (table === transactions) return 'transactions';
  return 'unknown';
}

// A minimal stand-in for the Drizzle query builder. Selects resolve from a FIFO
// queue in call order (item lookup, then local accounts); transaction writes go
// through insert().onConflictDoUpdate().returning(); the delete predicate is
// captured so the test can prove it is tenant- and plaid-id-scoped.
function createFakeDb(config: Required<RunConfig>, capture: Capture) {
  const { selectQueue, insertedFlags, deletedReturning } = config;

  const selectChain = {
    from: () => selectChain,
    where: () => selectChain,
    then: (resolve: (value: unknown) => void) => resolve(selectQueue.shift() ?? []),
  };

  return {
    execute: (query: unknown) => {
      capture.locks.push(query);
      capture.events.push('lock');
      return Promise.resolve([]);
    },
    select: () => selectChain,
    insert: (table: unknown) => {
      const name = tableName(table);
      return {
        values: (values: Row) => ({
          returning: () => {
            capture.inserts.push({ table: name, values });
            return Promise.resolve([values]);
          },
          onConflictDoUpdate: (cfg: { set: Row }) => ({
            returning: () => {
              capture.upserts.push({ table: name, values, set: cfg.set });
              const inserted = insertedFlags.length ? insertedFlags.shift() : true;
              return Promise.resolve([{ inserted }]);
            },
          }),
        }),
      };
    },
    update: (table: unknown) => ({
      set: (values: Row) => {
        capture.updates.push({ table: tableName(table), values });
        return {
          where: () => ({
            returning: () => Promise.resolve([]),
            then: (resolve: (value: unknown) => void) => resolve([]),
          }),
        };
      },
    }),
    delete: (table: unknown) => ({
      where: (condition: SQL) => {
        capture.deletes.push({ table: tableName(table), condition });
        return { returning: () => Promise.resolve(deletedReturning) };
      },
    }),
  };
}

function run(config: RunConfig, transactionsSync: ReturnType<typeof vi.fn>) {
  const capture: Capture = {
    inserts: [],
    upserts: [],
    updates: [],
    deletes: [],
    locks: [],
    events: [],
  };
  const fullConfig: Required<RunConfig> = {
    insertedFlags: [],
    deletedReturning: [],
    ...config,
  };
  const options = {
    database: createFakeDb(fullConfig, capture),
    plaidClient: { transactionsSync },
  } as unknown as Parameters<typeof syncPlaidItemForUser>[2];

  return { capture, options };
}

const onTable = <T extends { table: string }>(rows: T[], table: string) =>
  rows.filter((row) => row.table === table);

beforeEach(() => {
  PLAID_ITEM.cursor = null;
  PLAID_ITEM.status = 'active';
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('syncPlaidItemForUser', () => {
  it('aggregates paginated /transactions/sync pages, takes a lock, and persists the cursor', async () => {
    const transactionsSync = vi
      .fn()
      .mockResolvedValueOnce(
        syncPage({
          added: [plaidTransaction({ transaction_id: 'txn_p_1' })],
          has_more: true,
          next_cursor: 'cursor-1',
        }),
      )
      .mockResolvedValueOnce(
        syncPage({
          added: [plaidTransaction({ transaction_id: 'txn_p_2', amount: -50 })],
          has_more: false,
          next_cursor: 'cursor-2',
        }),
      );

    // item lookup, then local accounts (none yet).
    const { capture, options } = run(
      { selectQueue: [[PLAID_ITEM], []], insertedFlags: [true, true] },
      transactionsSync,
    );
    const result = await syncPlaidItemForUser(PLAID_ITEM.id, PLAID_ITEM.userId, options);

    expect(transactionsSync).toHaveBeenCalledTimes(2);
    expect(transactionsSync.mock.calls[0][0]).toMatchObject({ cursor: undefined, count: 500 });
    expect(transactionsSync.mock.calls[1][0]).toMatchObject({ cursor: 'cursor-1', count: 500 });

    expect(result.added).toBe(2);
    expect(result.accountsCreated).toBe(1);
    expect(result.cursor).toBe('cursor-2');

    // The apply ran under an advisory lock.
    expect(capture.locks.length).toBeGreaterThanOrEqual(1);
    expect(onTable(capture.inserts, 'accounts')).toHaveLength(1);
    expect(onTable(capture.upserts, 'transactions')).toHaveLength(2);

    const itemUpdate = onTable(capture.updates, 'plaidItems').at(-1);
    expect(itemUpdate?.values).toMatchObject({
      cursor: 'cursor-2',
      status: 'active',
      errorCode: null,
      errorMessage: null,
    });
  });

  it('takes the item lock before fetching from Plaid so cursor reads cannot go stale', async () => {
    const holder: { capture?: Capture } = {};
    const transactionsSync = vi.fn().mockImplementation((request) => {
      holder.capture?.events.push(`plaid:${request.cursor}`);
      return Promise.resolve(
        syncPage({
          added: [plaidTransaction({ transaction_id: 'txn_p_1' })],
          next_cursor: 'cursor-after-lock',
        }),
      );
    });

    const setup = run(
      {
        selectQueue: [
          [{ ...PLAID_ITEM, cursor: 'cursor-current' }],
          [LOCAL_ACCOUNT],
        ],
      },
      transactionsSync,
    );
    holder.capture = setup.capture;

    await syncPlaidItemForUser(PLAID_ITEM.id, PLAID_ITEM.userId, setup.options);

    expect(setup.capture.events.slice(0, 2)).toEqual(['lock', 'plaid:cursor-current']);
    expect(transactionsSync).toHaveBeenCalledWith(
      expect.objectContaining({ cursor: 'cursor-current' }),
    );
  });

  it('updates an existing transaction without overwriting user notes or category', async () => {
    PLAID_ITEM.cursor = 'cursor-1';
    const transactionsSync = vi.fn().mockResolvedValue(
      syncPage({
        modified: [plaidTransaction({ transaction_id: 'txn_p_1', amount: 9.99 })],
        next_cursor: 'cursor-2',
      }),
    );

    const { capture, options } = run(
      { selectQueue: [[PLAID_ITEM], [LOCAL_ACCOUNT]], insertedFlags: [false] },
      transactionsSync,
    );
    const result = await syncPlaidItemForUser(PLAID_ITEM.id, PLAID_ITEM.userId, options);

    expect(result.modified).toBe(1);
    expect(result.added).toBe(0);
    expect(result.accountsCreated).toBe(0);

    const upsert = onTable(capture.upserts, 'transactions').at(0);
    expect(upsert).toBeDefined();
    expect(Object.keys(upsert!.set)).not.toContain('notes');
    expect(Object.keys(upsert!.set)).not.toContain('categoryId');
    expect(upsert!.set).toMatchObject({ amount: -9990, accountId: 'acct_local_1' });
  });

  it('does not duplicate a transaction when a sync re-sends an already-stored row', async () => {
    const transactionsSync = vi.fn().mockResolvedValue(
      syncPage({
        added: [plaidTransaction({ transaction_id: 'txn_p_1' })],
        next_cursor: 'cursor-3',
      }),
    );

    // The conflict path reports inserted=false, i.e. the row already existed.
    const { capture, options } = run(
      { selectQueue: [[PLAID_ITEM], [LOCAL_ACCOUNT]], insertedFlags: [false] },
      transactionsSync,
    );
    const result = await syncPlaidItemForUser(PLAID_ITEM.id, PLAID_ITEM.userId, options);

    expect(result.added).toBe(0);
    expect(result.modified).toBe(1);
    // One upsert statement, never a second insert for the same plaid_id.
    expect(onTable(capture.upserts, 'transactions')).toHaveLength(1);
  });

  it('deletes removed transactions scoped to the tenant and plaid ids only', async () => {
    const transactionsSync = vi.fn().mockResolvedValue(
      syncPage({
        removed: [{ transaction_id: 'txn_p_removed' }],
        next_cursor: 'cursor-4',
      }),
    );

    const { capture, options } = run(
      {
        selectQueue: [[PLAID_ITEM], [LOCAL_ACCOUNT]],
        deletedReturning: [{ id: 'txn_local_removed' }],
      },
      transactionsSync,
    );
    const result = await syncPlaidItemForUser(PLAID_ITEM.id, PLAID_ITEM.userId, options);

    expect(result.removed).toBe(1);
    expect(capture.deletes).toHaveLength(1);

    // Prove the delete predicate filters by user_id AND plaid_id (not a blanket
    // delete), so manual rows (plaid_id null, other tenants) can never match.
    const { sql: deleteSql, params } = new PgDialect().sqlToQuery(capture.deletes[0].condition);
    expect(deleteSql).toContain('user_id');
    expect(deleteSql).toContain('plaid_id');
    expect(params).toContain('user_alice');
    expect(params).toContain('txn_p_removed');
  });

  it('relinks and unarchives an account that was attached to a prior Item', async () => {
    const archivedFromPriorItem = { ...LOCAL_ACCOUNT, plaidItemId: 'old_item_local' };
    const transactionsSync = vi.fn().mockResolvedValue(syncPage({ next_cursor: 'cursor-5' }));

    const { capture, options } = run(
      { selectQueue: [[PLAID_ITEM], [archivedFromPriorItem]] },
      transactionsSync,
    );
    await syncPlaidItemForUser(PLAID_ITEM.id, PLAID_ITEM.userId, options);

    const accountUpdate = onTable(capture.updates, 'accounts').at(0);
    expect(accountUpdate).toBeDefined();
    expect(accountUpdate!.values).toMatchObject({ plaidItemId: 'item_local_1', archivedAt: null });
  });

  it('marks the item as errored and rethrows when Plaid sync fails', async () => {
    const transactionsSync = vi.fn().mockRejectedValue({
      response: {
        data: {
          error_code: 'ITEM_LOGIN_REQUIRED',
          error_message: 'the login details of this item have changed',
        },
      },
    });

    const { capture, options } = run({ selectQueue: [[PLAID_ITEM]] }, transactionsSync);

    await expect(
      syncPlaidItemForUser(PLAID_ITEM.id, PLAID_ITEM.userId, options),
    ).rejects.toBeDefined();

    const itemUpdate = onTable(capture.updates, 'plaidItems').at(-1);
    expect(itemUpdate?.values).toMatchObject({
      status: 'error',
      errorCode: 'ITEM_LOGIN_REQUIRED',
    });
    expect(String(itemUpdate?.values.errorMessage)).toContain('login details');
  });

  it('does NOT flag the item on a transient Plaid failure so retries can recover', async () => {
    const transactionsSync = vi.fn().mockRejectedValue({
      response: {
        status: 503,
        data: { error_code: 'INTERNAL_SERVER_ERROR', error_message: 'plaid is temporarily down' },
      },
    });

    const { capture, options } = run({ selectQueue: [[PLAID_ITEM]] }, transactionsSync);

    await expect(
      syncPlaidItemForUser(PLAID_ITEM.id, PLAID_ITEM.userId, options),
    ).rejects.toBeDefined();

    // The bank is healthy — Plaid had a blip — so the Item must stay usable and
    // never be switched to 'error' (which the UI surfaces as "reconnect needed").
    const erroredUpdate = onTable(capture.updates, 'plaidItems').find(
      (update) => update.values.status === 'error',
    );
    expect(erroredUpdate).toBeUndefined();
  });
});
