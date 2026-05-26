import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state: {
  auth: { userId: string } | null;
  selectResults: unknown[][];
  insertedValues: unknown[];
  deletedReturning: unknown[];
  insertShouldThrow: Error | null;
} = {
  auth: { userId: 'user_alice' },
  selectResults: [],
  insertedValues: [],
  deletedReturning: [],
  insertShouldThrow: null,
};

vi.mock('@/db/drizzle', () => {
  const selectChain: Record<string, unknown> = {};
  for (const m of ['from', 'where']) selectChain[m] = () => selectChain;
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
    where: () => deleteChain,
    returning: () => Promise.resolve(state.deletedReturning),
  };

  const db = {
    select: () => selectChain,
    insert: () => insertChain,
    update: () => ({
      set: () => ({ where: () => ({ returning: () => Promise.resolve([{ id: 'acct_1', name: 'X', userId: 'user_alice' }]) }) }),
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
  state.deletedReturning = [];
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
});
