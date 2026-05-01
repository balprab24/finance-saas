import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state: {
  auth: { userId: string } | null;
  selectResults: unknown[][];
  insertedRows: unknown[][];
  transactionCalls: number;
} = {
  auth: { userId: 'user_alice' },
  selectResults: [],
  insertedRows: [],
  transactionCalls: 0,
};

vi.mock('@/db/drizzle', () => {
  const selectChain: Record<string, unknown> = {};
  for (const method of ['from', 'innerJoin', 'where']) {
    selectChain[method] = () => selectChain;
  }
  (selectChain as { then: (resolve: (value: unknown[]) => void) => void }).then = (
    resolve,
  ) => resolve(state.selectResults.shift() ?? []);

  const makeWriter = () => ({
    values: (rows: unknown | unknown[]) => {
      state.insertedRows.push(Array.isArray(rows) ? rows : [rows]);
      return Promise.resolve();
    },
  });

  const tx = {
    insert: () => makeWriter(),
  };

  const db = {
    select: () => selectChain,
    insert: () => makeWriter(),
    transaction: async (callback: (transaction: typeof tx) => Promise<void>) => {
      state.transactionCalls += 1;
      await callback(tx);
    },
  };

  return { db };
});

vi.mock('@hono/clerk-auth', () => ({
  clerkMiddleware: () => async (_c: unknown, next: () => Promise<void>) => {
    await next();
  },
  getAuth: () => state.auth,
}));

async function requestOnboarding(path: string, init?: RequestInit) {
  const { default: app } = await import('./onboarding');
  const response = await app.fetch(new Request(`http://localhost${path}`, init));
  return {
    status: response.status,
    body: (await response.json()) as Record<string, unknown>,
  };
}

beforeEach(() => {
  state.auth = { userId: 'user_alice' };
  state.selectResults = [];
  state.insertedRows = [];
  state.transactionCalls = 0;
});

afterEach(() => {
  vi.resetModules();
});

describe('onboarding API', () => {
  it('returns empty workspace counts for the authenticated user', async () => {
    state.selectResults.push([{ count: 0 }], [{ count: 0 }], [{ count: 0 }]);

    const { status, body } = await requestOnboarding('/status');

    expect(status).toBe(200);
    expect(body).toEqual({
      accountCount: 0,
      categoryCount: 0,
      transactionCount: 0,
      isEmpty: true,
    });
  });

  it('returns non-empty workspace counts for the authenticated user', async () => {
    state.selectResults.push([{ count: 1 }], [{ count: 2 }], [{ count: 3 }]);

    const { status, body } = await requestOnboarding('/status');

    expect(status).toBe(200);
    expect(body).toEqual({
      accountCount: 1,
      categoryCount: 2,
      transactionCount: 3,
      isEmpty: false,
    });
  });

  it('loads demo rows when the workspace is empty', async () => {
    state.selectResults.push([{ count: 0 }], [{ count: 0 }], [{ count: 0 }]);

    const { status, body } = await requestOnboarding('/demo', { method: 'POST' });

    expect(status).toBe(201);
    expect(body.accountCount).toBe(3);
    expect(body.categoryCount).toBe(9);
    expect(Number(body.transactionCount)).toBeGreaterThan(0);
    expect(body.isEmpty).toBe(false);
    expect(state.transactionCalls).toBe(1);
    expect(state.insertedRows).toHaveLength(3);
    expect(state.insertedRows[0]).toHaveLength(body.accountCount as number);
    expect(state.insertedRows[1]).toHaveLength(body.categoryCount as number);
    expect(state.insertedRows[2]).toHaveLength(body.transactionCount as number);
  });

  it('refuses demo rows when the workspace already has data', async () => {
    state.selectResults.push([{ count: 1 }], [{ count: 0 }], [{ count: 0 }]);

    const { status, body } = await requestOnboarding('/demo', { method: 'POST' });

    expect(status).toBe(409);
    expect(body.error).toBe('Demo data can only be loaded into an empty workspace');
    expect(state.transactionCalls).toBe(0);
    expect(state.insertedRows).toHaveLength(0);
  });

  it('rejects unauthorized requests', async () => {
    state.auth = null;

    const { status, body } = await requestOnboarding('/status');

    expect(status).toBe(401);
    expect(body.error).toBe('Unauthorized');
    expect(state.selectResults).toHaveLength(0);
  });
});
