import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state: {
  auth: { userId: string } | null;
  selectResults: unknown[][];
  returningResults: unknown[][];
  returningColumns: Array<string[] | null>;
  updateCalls: number;
} = {
  auth: { userId: 'user_alice' },
  selectResults: [],
  returningResults: [],
  returningColumns: [],
  updateCalls: 0,
};

vi.mock('@/db/drizzle', () => {
  const selectChain: Record<string, unknown> = {};
  const passthrough = ['from', 'where', 'innerJoin', 'leftJoin', 'groupBy', 'orderBy', 'limit'];
  for (const m of passthrough) selectChain[m] = () => selectChain;
  (selectChain as { then: (resolve: (v: unknown[]) => void) => void }).then = (
    resolve,
  ) => resolve(state.selectResults.shift() ?? []);

  const writeChain: Record<string, unknown> = {};
  const writePassthrough = ['set', 'where', 'values'];
  for (const m of writePassthrough) writeChain[m] = () => writeChain;
  (writeChain as { returning: (cols?: Record<string, unknown>) => Promise<unknown[]> }).returning =
    (cols) => {
      state.returningColumns.push(cols ? Object.keys(cols) : null);
      return Promise.resolve(
        state.returningResults.length ? state.returningResults.shift()! : [{ id: 'tx_1' }],
      );
    };

  const cte = { as: () => ({}) };

  const db = {
    select: () => selectChain,
    insert: () => writeChain,
    update: () => {
      state.updateCalls += 1;
      return writeChain;
    },
    delete: () => writeChain,
    $with: () => cte,
    with: () => ({
      update: () => {
        state.updateCalls += 1;
        return writeChain;
      },
      delete: () => writeChain,
    }),
  };

  return { db };
});

vi.mock('@clerk/hono', () => ({
  clerkMiddleware: () => async (_c: unknown, next: () => Promise<void>) => {
    await next();
  },
  getAuth: () => state.auth,
}));

vi.mock('@/lib/api-rate-limit', () => ({
  API_RATE_LIMITS: {
    read: { limit: 1, windowMs: 1000 },
    mutation: { limit: 1, windowMs: 1000 },
    bulkMutation: { limit: 1, windowMs: 1000 },
    export: { limit: 1, windowMs: 1000 },
  },
  authenticatedRateLimit: () => async (_c: unknown, next: () => Promise<void>) => {
    await next();
  },
}));

const validPatchBody = {
  amount: -1500,
  payee: 'Coffee Shop',
  notes: null,
  date: '2026-04-30T12:00:00.000Z',
  accountId: 'acct_owned_by_bob',
  categoryId: null as string | null,
};

async function patchTransaction(body: typeof validPatchBody) {
  const { default: app } = await import('./transactions');
  const res = await app.fetch(
    new Request('http://localhost/tx_1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
  return { status: res.status, body: (await res.json()) as { error?: string } };
}

beforeEach(() => {
  state.auth = { userId: 'user_alice' };
  state.selectResults = [];
  state.returningResults = [];
  state.returningColumns = [];
  state.updateCalls = 0;
});

afterEach(() => {
  vi.resetModules();
});

describe('GET /transactions/export', () => {
  it('returns an attachment CSV with injection-guarded fields and exact amounts', async () => {
    state.selectResults.push([
      {
        date: new Date(2026, 5, 15),
        payee: '=SUM(A1:A9)',
        amount: -15990,
        category: 'Subscriptions',
        account: 'Checking',
        notes: null,
      },
    ]);

    const { default: app } = await import('./transactions');
    const res = await app.fetch(new Request('http://localhost/export'));

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/csv');
    expect(res.headers.get('content-disposition')).toMatch(
      /attachment; filename="aurex-transactions-.*\.csv"/,
    );
    expect(res.headers.get('x-export-truncated')).toBeNull();

    const body = await res.text();
    expect(body.startsWith('date,payee,amount,category,account,notes\r\n')).toBe(true);
    expect(body).toContain("'=SUM(A1:A9)");
    expect(body).toContain('-15.990');
  });

  it('requires authentication', async () => {
    state.auth = null;
    const { default: app } = await import('./transactions');
    const res = await app.fetch(new Request('http://localhost/export'));
    expect(res.status).toBe(401);
  });

  it('is not captured by the :id route', async () => {
    state.selectResults.push([]);
    const { default: app } = await import('./transactions');
    const res = await app.fetch(new Request('http://localhost/export'));
    // The :id handler would 404 on an unknown id; export returns an empty CSV.
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/csv');
  });
});

describe('PATCH /transactions/:id ownership checks', () => {
  it('rejects a payload that points at an accountId the caller does not own', async () => {
    state.selectResults.push([]); // account ownership lookup returns empty
    const { status, body } = await patchTransaction(validPatchBody);
    expect(status).toBe(400);
    expect(body.error).toBe('Invalid account');
    expect(state.updateCalls).toBe(0);
  });

  it('rejects a payload that points at a categoryId the caller does not own', async () => {
    state.selectResults.push([{ id: 'acct_alice' }]); // account ownership ok
    state.selectResults.push([]); // category ownership lookup returns empty
    const { status, body } = await patchTransaction({
      ...validPatchBody,
      accountId: 'acct_alice',
      categoryId: 'cat_owned_by_bob',
    });
    expect(status).toBe(400);
    expect(body.error).toBe('Invalid category');
    expect(state.updateCalls).toBe(0);
  });

  it('rejects a payload that targets an archived account', async () => {
    state.selectResults.push([]); // archived-aware account lookup returns no row
    const { status, body } = await patchTransaction(validPatchBody);
    expect(status).toBe(400);
    expect(body.error).toBe('Invalid account');
    expect(state.updateCalls).toBe(0);
  });
});

// The userId-scoped where clause means another tenant's id behaves exactly like
// a missing row: the contract is 404, never data or a 500.
describe('cross-tenant :id access returns 404', () => {
  it('GET /:id for a transaction the caller does not own', async () => {
    state.selectResults.push([]); // scoped lookup finds no row
    const { default: app } = await import('./transactions');
    const res = await app.fetch(new Request('http://localhost/tx_owned_by_bob'));
    expect(res.status).toBe(404);
    expect(((await res.json()) as { error: string }).error).toBe('Not found');
  });

  it('PATCH /:id for a transaction the caller does not own', async () => {
    state.selectResults.push([{ id: 'acct_alice' }]); // caller owns the payload account
    state.returningResults.push([]); // scoped update matches no row
    const { status, body } = await patchTransaction({
      ...validPatchBody,
      accountId: 'acct_alice',
    });
    expect(status).toBe(404);
    expect(body.error).toBe('Not found');
  });

  it('DELETE /:id for a transaction the caller does not own', async () => {
    state.returningResults.push([]); // scoped delete matches no row
    const { default: app } = await import('./transactions');
    const res = await app.fetch(
      new Request('http://localhost/tx_owned_by_bob', { method: 'DELETE' }),
    );
    expect(res.status).toBe(404);
    expect(((await res.json()) as { error: string }).error).toBe('Not found');
  });
});

describe('delete responses echo only restore-safe columns', () => {
  const restoreColumns = ['id', 'amount', 'payee', 'notes', 'date', 'accountId', 'categoryId'];

  it('DELETE /:id selects the explicit undo column list', async () => {
    state.returningResults.push([{ id: 'tx_1' }]);
    const { default: app } = await import('./transactions');
    const res = await app.fetch(new Request('http://localhost/tx_1', { method: 'DELETE' }));
    expect(res.status).toBe(200);
    expect(state.returningColumns.at(0)).toEqual(restoreColumns);
    expect(state.returningColumns.at(0)).not.toContain('plaidId');
    expect(state.returningColumns.at(0)).not.toContain('userId');
  });

  it('POST /bulk-delete selects the explicit undo column list', async () => {
    state.returningResults.push([{ id: 'tx_1' }, { id: 'tx_2' }]);
    const { default: app } = await import('./transactions');
    const res = await app.fetch(
      new Request('http://localhost/bulk-delete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ids: ['tx_1', 'tx_2'] }),
      }),
    );
    expect(res.status).toBe(200);
    expect(state.returningColumns.at(0)).toEqual(restoreColumns);
    expect(state.returningColumns.at(0)).not.toContain('plaidId');
  });
});
