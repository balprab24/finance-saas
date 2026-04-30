import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state: { selectResults: unknown[][]; updateCalls: number } = {
  selectResults: [],
  updateCalls: 0,
};

vi.mock('@/db/drizzle', () => {
  const selectChain: Record<string, unknown> = {};
  const passthrough = ['from', 'where', 'innerJoin', 'leftJoin', 'groupBy', 'orderBy'];
  for (const m of passthrough) selectChain[m] = () => selectChain;
  (selectChain as { then: (resolve: (v: unknown[]) => void) => void }).then = (
    resolve,
  ) => resolve(state.selectResults.shift() ?? []);

  const writeChain: Record<string, unknown> = {};
  const writePassthrough = ['set', 'where', 'values'];
  for (const m of writePassthrough) writeChain[m] = () => writeChain;
  (writeChain as { returning: () => Promise<unknown[]> }).returning = () =>
    Promise.resolve([{ id: 'tx_1' }]);

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

vi.mock('@hono/clerk-auth', () => ({
  clerkMiddleware: () => async (_c: unknown, next: () => Promise<void>) => {
    await next();
  },
  getAuth: () => ({ userId: 'user_alice' }),
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
  state.selectResults = [];
  state.updateCalls = 0;
});

afterEach(() => {
  vi.resetModules();
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
});
