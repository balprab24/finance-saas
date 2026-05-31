import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state: {
  auth: { userId: string } | null;
  selectResults: unknown[][];
  insertedValues: unknown[];
  updatedValues: unknown[];
  updatedReturning: unknown[];
  deletedReturning: unknown[];
  deleteCalls: number;
  insertShouldThrow: Error | null;
} = {
  auth: { userId: 'user_alice' },
  selectResults: [],
  insertedValues: [],
  updatedValues: [],
  updatedReturning: [{ id: 'acct_1', name: 'X', userId: 'user_alice', archivedAt: null }],
  deletedReturning: [],
  deleteCalls: 0,
  insertShouldThrow: null,
};

vi.mock('@/db/drizzle', () => {
  const selectChain: Record<string, unknown> = {};
  for (const m of ['from', 'where', 'leftJoin']) selectChain[m] = () => selectChain;
  (selectChain as { then: (resolve: (v: unknown[]) => void) => void }).then = (resolve) =>
    resolve(state.selectResults.shift() ?? []);

  const insertChain = {
    values: (rows: unknown) => {
      state.insertedValues.push(rows);
      return {
        returning: () => {
          if (state.insertShouldThrow) throw state.insertShouldThrow;
          return Promise.resolve([rows]);
        },
      };
    },
  };

  const deleteChain = {
    where: () => {
      state.deleteCalls += 1;
      return deleteChain;
    },
    returning: () => Promise.resolve(state.deletedReturning),
  };

  const db = {
    select: () => selectChain,
    insert: () => insertChain,
    update: () => ({
      set: (values: unknown) => {
        state.updatedValues.push(values);
        return { where: () => ({ returning: () => Promise.resolve(state.updatedReturning) }) };
      },
    }),
    delete: () => deleteChain,
  };

  return { db };
});

vi.mock('@clerk/hono', () => ({
  clerkMiddleware: () => async (_c: unknown, next: () => Promise<void>) => {
    await next();
  },
  getAuth: () => state.auth,
}));

async function request(path: string, init?: RequestInit) {
  const { default: app } = await import('./accounts');
  const res = await app.fetch(new Request(`http://localhost${path}`, init));
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

beforeEach(() => {
  state.auth = { userId: 'user_alice' };
  state.selectResults = [];
  state.insertedValues = [];
  state.updatedValues = [];
  state.updatedReturning = [{ id: 'acct_1', name: 'X', userId: 'user_alice', archivedAt: null }];
  state.deletedReturning = [];
  state.deleteCalls = 0;
  state.insertShouldThrow = null;
});

afterEach(() => {
  vi.resetModules();
});

describe('accounts route — auth and validation', () => {
  it('returns 401 when unauthenticated', async () => {
    state.auth = null;
    const { status, body } = await request('/');
    expect(status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('trims account names server-side', async () => {
    const { status } = await request('/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '   Aurex Checking   ' }),
    });
    expect(status).toBe(200);
    expect(state.insertedValues.at(0)).toMatchObject({
      name: 'Aurex Checking',
      userId: 'user_alice',
    });
  });

  it('rejects whitespace-only names with 400', async () => {
    const { status, body } = await request('/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '   ' }),
    });
    expect(status).toBe(400);
    // zValidator default 400 response includes the zod error object
    expect(body.success).toBe(false);
  });

  it('translates unique-violation errors into 409', async () => {
    state.insertShouldThrow = Object.assign(new Error('duplicate'), { code: '23505' });
    const { status, body } = await request('/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Existing Account' }),
    });
    expect(status).toBe(409);
    expect(body.error).toBe('An account with that name already exists');
  });

  it('surfaces case-insensitive collisions as the same 409', async () => {
    state.insertShouldThrow = Object.assign(new Error('duplicate'), { code: '23505' });
    const { status, body } = await request('/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'savings' }),
    });
    expect(status).toBe(409);
    expect(body.error).toBe('An account with that name already exists');
  });

  it('rejects bulk-delete with too many ids', async () => {
    const ids = Array.from({ length: 501 }, (_, i) => `id_${i}`);
    const { status, body } = await request('/bulk-delete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('rejects bulk-delete with an empty ids array', async () => {
    const { status } = await request('/bulk-delete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ids: [] }),
    });
    expect(status).toBe(400);
  });

  it('archives accounts without deleting their transactions', async () => {
    const { status, body } = await request('/acct_1/archive', { method: 'POST' });

    expect(status).toBe(200);
    expect(body.data).toMatchObject({ id: 'acct_1' });
    expect(state.updatedValues.at(0)).toMatchObject({ archivedAt: expect.any(Date) });
    expect(state.deleteCalls).toBe(0);
  });

  it('restores archived accounts', async () => {
    const { status } = await request('/acct_1/restore', { method: 'POST' });

    expect(status).toBe(200);
    expect(state.updatedValues.at(0)).toEqual({ archivedAt: null });
  });

  it('rejects hard delete when an account has transactions', async () => {
    state.selectResults = [[{ count: 2 }]];

    const { status, body } = await request('/acct_1', { method: 'DELETE' });

    expect(status).toBe(409);
    expect(body.error).toBe('Archive accounts with transactions instead of deleting them');
    expect(state.deleteCalls).toBe(0);
  });

  it('allows hard delete when an account is empty', async () => {
    state.selectResults = [[{ count: 0 }]];
    state.deletedReturning = [{ id: 'acct_1' }];

    const { status, body } = await request('/acct_1', { method: 'DELETE' });

    expect(status).toBe(200);
    expect(body.data).toMatchObject({ id: 'acct_1' });
    expect(state.deleteCalls).toBe(1);
  });

  it('rejects bulk hard delete when any selected account has transactions', async () => {
    state.selectResults = [[{ count: 3 }]];

    const { status, body } = await request('/bulk-delete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ids: ['acct_1', 'acct_2'] }),
    });

    expect(status).toBe(409);
    expect(body.error).toBe('Archive accounts with transactions instead of deleting them');
    expect(state.deleteCalls).toBe(0);
  });

  it('lists archived accounts when includeArchived=true', async () => {
    state.selectResults = [[
      { id: 'acct_1', name: 'Savings', archivedAt: null },
      { id: 'acct_2', name: 'Old Card', archivedAt: new Date('2026-01-01') },
    ]];

    const { status, body } = await request('/?includeArchived=true');

    expect(status).toBe(200);
    const data = body.data as Array<{ id: string; archivedAt: string | null }>;
    expect(data).toHaveLength(2);
    expect(data.map((d) => d.id)).toEqual(['acct_1', 'acct_2']);
  });

  it('bulk-archives selected accounts and returns archivedAt', async () => {
    state.updatedReturning = [
      { id: 'acct_1', archivedAt: new Date('2026-05-28') },
      { id: 'acct_2', archivedAt: new Date('2026-05-28') },
    ];

    const { status, body } = await request('/bulk-archive', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ids: ['acct_1', 'acct_2'] }),
    });

    expect(status).toBe(200);
    expect(state.updatedValues.at(0)).toMatchObject({ archivedAt: expect.any(Date) });
    expect(state.deleteCalls).toBe(0);
    const data = body.data as Array<{ id: string }>;
    expect(data.map((d) => d.id)).toEqual(['acct_1', 'acct_2']);
  });

  it('rejects bulk-archive with empty ids', async () => {
    const { status } = await request('/bulk-archive', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ids: [] }),
    });

    expect(status).toBe(400);
  });
});
