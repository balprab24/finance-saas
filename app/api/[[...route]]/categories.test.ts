import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state: {
  auth: { userId: string } | null;
  insertedValues: unknown[];
  insertShouldThrow: Error | null;
} = {
  auth: { userId: 'user_alice' },
  insertedValues: [],
  insertShouldThrow: null,
};

vi.mock('@/db/drizzle', () => {
  const selectChain: Record<string, unknown> = {};
  for (const m of ['from', 'where']) selectChain[m] = () => selectChain;
  (selectChain as { then: (resolve: (v: unknown[]) => void) => void }).then = (resolve) =>
    resolve([]);

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

  const db = {
    select: () => selectChain,
    insert: () => insertChain,
    update: () => ({
      set: () => ({ where: () => ({ returning: () => Promise.resolve([{ id: 'cat_1', name: 'X', userId: 'user_alice' }]) }) }),
    }),
    delete: () => ({
      where: () => ({ returning: () => Promise.resolve([{ id: 'cat_1' }]) }),
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

async function request(path: string, init?: RequestInit) {
  const { default: app } = await import('./categories');
  const res = await app.fetch(new Request(`http://localhost${path}`, init));
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

beforeEach(() => {
  state.auth = { userId: 'user_alice' };
  state.insertedValues = [];
  state.insertShouldThrow = null;
});

afterEach(() => {
  vi.resetModules();
});

describe('categories route — auth and validation', () => {
  it('returns 401 when unauthenticated', async () => {
    state.auth = null;
    const { status, body } = await request('/');
    expect(status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('trims category names server-side', async () => {
    const { status } = await request('/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '   Dining   ' }),
    });

    expect(status).toBe(200);
    expect(state.insertedValues.at(0)).toMatchObject({
      name: 'Dining',
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
    expect(body.success).toBe(false);
  });

  it('surfaces case-insensitive collisions as the same 409', async () => {
    state.insertShouldThrow = Object.assign(new Error('duplicate'), { code: '23505' });

    const { status, body } = await request('/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'groceries' }),
    });

    expect(status).toBe(409);
    expect(body.error).toBe('A category with that name already exists');
  });
});
