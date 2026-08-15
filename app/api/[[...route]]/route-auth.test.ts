import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state: {
  auth: { userId: string } | null;
  rateLimitCalls: Array<{ key: string }>;
} = {
  auth: { userId: 'user_alice' },
  rateLimitCalls: [],
};

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: (values: { key: string }) => {
    state.rateLimitCalls.push(values);
    return Promise.resolve({
      allowed: true,
      limit: 60,
      remaining: 59,
      resetAt: new Date('2026-01-01T00:01:00Z'),
      retryAfterSeconds: 60,
    });
  },
  clientIpFromHeaders: () => '203.0.113.10',
}));

vi.mock('@/db/drizzle', () => {
  const selectChain: Record<string, unknown> = {};
  for (const method of ['from', 'where', 'innerJoin', 'leftJoin', 'groupBy', 'orderBy', 'limit']) {
    selectChain[method] = () => selectChain;
  }
  (selectChain as { then: (resolve: (value: unknown[]) => void) => void }).then = (
    resolve,
  ) => resolve([]);

  return {
    db: {
      select: () => selectChain,
      insert: () => ({ values: () => ({ returning: () => Promise.resolve([]) }) }),
      update: () => ({ set: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }) }),
      delete: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }),
    },
  };
});

vi.mock('@clerk/hono', () => ({
  clerkMiddleware: () => async (_c: unknown, next: () => Promise<void>) => {
    await next();
  },
  getAuth: () => state.auth,
}));

vi.mock('@/lib/observability', () => ({
  reportApiRouteError: () => {},
}));

vi.mock('@/lib/plaid', () => ({
  getPlaidClient: () => {
    throw new Error('Plaid client should not be constructed in this test');
  },
  getPlaidCountryCodes: () => ['US'],
  getPlaidProducts: () => ['transactions'],
  getPlaidWebhookUrl: () => undefined,
}));

vi.mock('@/lib/server-crypto', () => ({
  encryptSecret: (value: string) => `enc:${value}`,
  decryptSecret: (value: string) => value.replace(/^enc:/, ''),
}));

vi.mock('@/lib/plaid-webhook', () => ({
  verifyPlaidWebhookToken: () => Promise.resolve({ request_body_sha256: 'nope' }),
}));

vi.mock('@/lib/plaid-webhook-replay', () => ({
  recordPlaidWebhookEvent: () => Promise.resolve({ isReplay: false }),
}));

vi.mock('@/lib/plaid-sync', () => ({
  getPlaidErrorDetails: () => ({ errorCode: undefined, errorMessage: 'Plaid failed' }),
  syncPlaidItemForUser: () => Promise.resolve({ added: 0, modified: 0, removed: 0 }),
  upsertPlaidAccountsForItem: () => Promise.resolve([]),
}));

vi.mock('@/lib/plaid-sync-jobs', () => ({
  enqueuePlaidSyncJob: () => Promise.resolve(null),
  enqueuePlaidSyncJobByPlaidItemId: () => Promise.resolve(null),
}));

vi.mock('@/lib/after-drain', () => ({
  scheduleWarmDrain: () => {},
}));

async function request(path: string, init?: RequestInit) {
  const routeModule = await import('./route');
  const handler = init?.method === 'POST' ? routeModule.POST : routeModule.GET;
  const res = await handler(new Request(`http://localhost${path}`, init));
  return { status: res.status, body: (await res.json()) as { error?: string } };
}

beforeEach(() => {
  state.auth = { userId: 'user_alice' };
  state.rateLimitCalls = [];
});

afterEach(() => {
  vi.resetModules();
});

describe('app-level default-deny auth', () => {
  it('returns 401 for an unauthenticated data route', async () => {
    state.auth = null;
    const { status, body } = await request('/api/accounts');
    expect(status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('covers every mounted module, not just accounts', async () => {
    state.auth = null;
    const { status } = await request('/api/summary');
    expect(status).toBe(401);
  });

  it('exempts the Plaid webhook, whose own verification still rejects', async () => {
    state.auth = null;
    const { status, body } = await request('/api/plaid/webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ webhook_type: 'TRANSACTIONS' }),
    });
    // 'Missing Plaid verification token' proves the request passed the
    // default-deny guard and reached the webhook handler's own auth.
    expect(status).toBe(401);
    expect(body.error).toBe('Missing Plaid verification token');
  });

  it('passes authenticated requests through to route logic', async () => {
    const { status } = await request('/api/accounts');
    expect(status).toBe(200);
    expect(state.rateLimitCalls.at(0)?.key).toBe('api:accounts:read:user:user_alice');
  });
});
