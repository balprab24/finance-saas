import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state: {
  auth: { userId: string } | null;
  selectResults: unknown[][];
  insertedValues: unknown[];
  insertShouldThrow: Error | null;
  updatedValues: unknown[];
  plaidClient: {
    linkTokenCreate: ReturnType<typeof vi.fn>;
    itemPublicTokenExchange: ReturnType<typeof vi.fn>;
    accountsGet: ReturnType<typeof vi.fn>;
    itemRemove: ReturnType<typeof vi.fn>;
  };
  syncByUser: ReturnType<typeof vi.fn>;
  syncByPlaidItemId: ReturnType<typeof vi.fn>;
  upsertAccounts: ReturnType<typeof vi.fn>;
  verifyWebhook: ReturnType<typeof vi.fn>;
} = {
  auth: { userId: 'user_alice' },
  selectResults: [],
  insertedValues: [],
  insertShouldThrow: null,
  updatedValues: [],
  plaidClient: {
    linkTokenCreate: vi.fn(),
    itemPublicTokenExchange: vi.fn(),
    accountsGet: vi.fn(),
    itemRemove: vi.fn(),
  },
  syncByUser: vi.fn(),
  syncByPlaidItemId: vi.fn(),
  upsertAccounts: vi.fn(),
  verifyWebhook: vi.fn(),
};

vi.mock('@/db/drizzle', () => {
  const selectChain: Record<string, unknown> = {};
  for (const m of ['from', 'where']) selectChain[m] = () => selectChain;
  (selectChain as { then: (resolve: (v: unknown[]) => void) => void }).then = (resolve) =>
    resolve((state.selectResults.shift() as unknown[]) ?? []);

  const db = {
    select: () => selectChain,
    insert: () => ({
      values: (values: unknown) => {
        state.insertedValues.push(values);
        if (state.insertShouldThrow) return Promise.reject(state.insertShouldThrow);
        return Promise.resolve();
      },
    }),
    update: () => ({
      set: (values: unknown) => {
        state.updatedValues.push(values);
        return { where: () => Promise.resolve([]) };
      },
    }),
    transaction: async (callback: (tx: unknown) => Promise<unknown>) => callback(db),
  };

  return { db };
});

vi.mock('@clerk/hono', () => ({
  clerkMiddleware: () => async (_c: unknown, next: () => Promise<void>) => {
    await next();
  },
  getAuth: () => state.auth,
}));

vi.mock('@/lib/plaid', () => ({
  getPlaidClient: () => state.plaidClient,
  getPlaidCountryCodes: () => ['US'],
  getPlaidProducts: () => ['transactions'],
  getPlaidWebhookUrl: () => 'https://aurex.test/api/plaid/webhook',
}));

vi.mock('@/lib/server-crypto', () => ({
  encryptSecret: (value: string) => `encrypted:${value}`,
  decryptSecret: (value: string) => value.replace(/^encrypted:/, ''),
}));

vi.mock('@/lib/plaid-webhook', () => ({
  verifyPlaidWebhookToken: (token: string) => state.verifyWebhook(token),
}));

vi.mock('@/lib/plaid-sync', () => ({
  PlaidItemNotFoundError: class PlaidItemNotFoundError extends Error {},
  getPlaidErrorDetails: (err: unknown) => {
    const data = (err as { response?: { data?: { error_code?: string; error_message?: string } } })
      ?.response?.data;
    return {
      errorCode: data?.error_code,
      errorMessage: data?.error_message ?? (err instanceof Error ? err.message : 'Plaid failed'),
    };
  },
  syncPlaidItemByPlaidItemId: (itemId: string) => state.syncByPlaidItemId(itemId),
  syncPlaidItemForUser: (itemId: string, userId: string) => state.syncByUser(itemId, userId),
  upsertPlaidAccountsForItem: (values: unknown) => state.upsertAccounts(values),
}));

async function request(path: string, init?: RequestInit) {
  const { default: app } = await import('./plaid');
  const res = await app.fetch(new Request(`http://localhost${path}`, init));
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

beforeEach(() => {
  state.auth = { userId: 'user_alice' };
  state.selectResults = [];
  state.insertedValues = [];
  state.insertShouldThrow = null;
  state.updatedValues = [];
  state.plaidClient.linkTokenCreate.mockResolvedValue({
    data: { link_token: 'link-sandbox-123' },
  });
  state.plaidClient.itemPublicTokenExchange.mockResolvedValue({
    data: { access_token: 'access-sandbox-123', item_id: 'item-sandbox-123' },
  });
  state.plaidClient.accountsGet.mockResolvedValue({ data: { accounts: [] } });
  state.plaidClient.itemRemove.mockResolvedValue({ data: {} });
  state.syncByUser.mockResolvedValue({
    itemId: 'local-item-id',
    accountsCreated: 0,
    added: 3,
    modified: 1,
    removed: 0,
    cursor: 'cursor-next',
  });
  state.syncByPlaidItemId.mockResolvedValue({
    itemId: 'local-item-id',
    accountsCreated: 0,
    added: 1,
    modified: 0,
    removed: 0,
    cursor: 'cursor-next',
  });
  state.upsertAccounts.mockResolvedValue({ created: 2, accountIdByPlaidId: new Map() });
  state.verifyWebhook.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe('Plaid route', () => {
  it('returns 401 when creating a Link token unauthenticated', async () => {
    state.auth = null;

    const { status, body } = await request('/link-token', { method: 'POST' });

    expect(status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('creates Link tokens with Transactions settings and the Clerk user id', async () => {
    const { status, body } = await request('/link-token', { method: 'POST' });

    expect(status).toBe(200);
    expect(body.data).toMatchObject({ linkToken: 'link-sandbox-123' });
    expect(state.plaidClient.linkTokenCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        client_name: 'Aurex',
        country_codes: ['US'],
        products: ['transactions'],
        user: { client_user_id: 'user_alice' },
        webhook: 'https://aurex.test/api/plaid/webhook',
        transactions: { days_requested: 730 },
      }),
    );
  });

  it('exchanges public tokens and stores encrypted access tokens', async () => {
    const { status, body } = await request('/exchange-public-token', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        publicToken: 'public-sandbox-123',
        metadata: { institution: { name: 'First Test Bank', institution_id: 'ins_test' } },
      }),
    });

    expect(status).toBe(200);
    expect(state.plaidClient.itemPublicTokenExchange).toHaveBeenCalledWith({
      public_token: 'public-sandbox-123',
    });
    expect(state.insertedValues.at(0)).toMatchObject({
      userId: 'user_alice',
      plaidItemId: 'item-sandbox-123',
      accessToken: 'encrypted:access-sandbox-123',
      institutionId: 'ins_test',
      institutionName: 'First Test Bank',
    });
    expect(body.data).toMatchObject({
      accountsCreated: 2,
      transactionsCreated: 3,
      transactionsModified: 1,
      transactionsRemoved: 0,
    });
  });

  it('revokes the Plaid item when local persistence fails after exchange', async () => {
    state.plaidClient.accountsGet.mockRejectedValue(new Error('accounts fetch failed'));

    const { status } = await request('/exchange-public-token', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ publicToken: 'public-sandbox-123' }),
    });

    expect(status).toBe(502);
    // The freshly exchanged Item is revoked so it is not orphaned at Plaid.
    expect(state.plaidClient.itemRemove).toHaveBeenCalledWith({
      access_token: 'access-sandbox-123',
    });
    expect(state.insertedValues).toHaveLength(0);
  });

  it('does not revoke the Plaid item when the bank is already linked', async () => {
    state.insertShouldThrow = Object.assign(new Error('duplicate'), { code: '23505' });

    const { status, body } = await request('/exchange-public-token', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ publicToken: 'public-sandbox-123' }),
    });

    expect(status).toBe(409);
    expect(body.error).toBe('This bank connection is already linked');
    expect(state.plaidClient.itemRemove).not.toHaveBeenCalled();
  });

  it('links the bank but reports error status when the initial sync fails', async () => {
    state.syncByUser.mockRejectedValue(new Error('sync failed'));

    const { status, body } = await request('/exchange-public-token', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ publicToken: 'public-sandbox-123' }),
    });

    expect(status).toBe(200);
    expect(body.data).toMatchObject({ status: 'error', accountsCreated: 2 });
    // A sync failure must not revoke the now-linked Item.
    expect(state.plaidClient.itemRemove).not.toHaveBeenCalled();
  });

  it('removes an owned item and archives its linked accounts', async () => {
    state.selectResults = [
      [{ id: 'item_1', userId: 'user_alice', status: 'active', accessToken: 'encrypted:access-1' }],
    ];

    const { status, body } = await request('/items/item_1', { method: 'DELETE' });

    expect(status).toBe(200);
    expect(body.data).toMatchObject({ itemId: 'item_1' });
    expect(state.plaidClient.itemRemove).toHaveBeenCalledWith({ access_token: 'access-1' });
    expect(
      state.updatedValues.some((v) => (v as { status?: string }).status === 'removed'),
    ).toBe(true);
    expect(state.updatedValues.some((v) => 'archivedAt' in (v as object))).toBe(true);
  });

  it('cleans up locally when Plaid reports the item already gone (idempotent retry)', async () => {
    state.selectResults = [
      [{ id: 'item_1', userId: 'user_alice', status: 'active', accessToken: 'encrypted:access-1' }],
    ];
    state.plaidClient.itemRemove.mockRejectedValue({
      response: { data: { error_code: 'ITEM_NOT_FOUND' } },
    });

    const { status } = await request('/items/item_1', { method: 'DELETE' });

    expect(status).toBe(200);
    expect(
      state.updatedValues.some((v) => (v as { status?: string }).status === 'removed'),
    ).toBe(true);
  });

  it('returns 404 when removing an already-removed item', async () => {
    state.selectResults = [
      [{ id: 'item_1', userId: 'user_alice', status: 'removed', accessToken: 'encrypted:access-1' }],
    ];

    const { status } = await request('/items/item_1', { method: 'DELETE' });

    expect(status).toBe(404);
  });

  it('rejects webhooks without a Plaid verification token', async () => {
    const { status, body } = await request('/webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ webhook_type: 'TRANSACTIONS' }),
    });

    expect(status).toBe(401);
    expect(body.error).toBe('Missing Plaid verification token');
  });

  it('runs sync for valid transaction update webhooks', async () => {
    const { status } = await request('/webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'plaid-verification': 'jwt-token',
      },
      body: JSON.stringify({
        webhook_type: 'TRANSACTIONS',
        webhook_code: 'SYNC_UPDATES_AVAILABLE',
        item_id: 'item-sandbox-123',
      }),
    });

    expect(status).toBe(200);
    expect(state.verifyWebhook).toHaveBeenCalledWith('jwt-token');
    expect(state.syncByPlaidItemId).toHaveBeenCalledWith('item-sandbox-123');
  });
});
