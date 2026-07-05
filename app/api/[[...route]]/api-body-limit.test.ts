import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MAX_API_BODY_BYTES } from '@/lib/api-body-limit';

const blockedResult = {
  allowed: false,
  limit: 1,
  remaining: 0,
  resetAt: new Date('2026-01-01T00:01:00Z'),
  retryAfterSeconds: 42,
};

const state: {
  auth: { userId: string } | null;
  rateLimitCalls: Array<{ key: string }>;
  insertCalls: number;
  webhookVerifyCalls: number;
} = {
  auth: { userId: 'user_alice' },
  rateLimitCalls: [],
  insertCalls: 0,
  webhookVerifyCalls: 0,
};

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: (values: { key: string }) => {
    state.rateLimitCalls.push(values);
    return Promise.resolve(blockedResult);
  },
  clientIpFromHeaders: () => '203.0.113.10',
}));

vi.mock('@/db/drizzle', () => {
  const selectChain: Record<string, unknown> = {};
  for (const method of ['from', 'where', 'innerJoin', 'leftJoin', 'groupBy', 'orderBy']) {
    selectChain[method] = () => selectChain;
  }
  (selectChain as { then: (resolve: (value: unknown[]) => void) => void }).then = (
    resolve,
  ) => resolve([]);

  const writeChain = {
    values: () => ({
      returning: () => Promise.resolve([]),
      onConflictDoUpdate: () => ({ returning: () => Promise.resolve([]) }),
    }),
  };

  return {
    db: {
      select: () => selectChain,
      insert: () => {
        state.insertCalls += 1;
        return writeChain;
      },
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
  verifyPlaidWebhookToken: () => {
    state.webhookVerifyCalls += 1;
    return Promise.resolve({ request_body_sha256: 'nope' });
  },
}));

vi.mock('@/lib/plaid-webhook-replay', () => ({
  recordPlaidWebhookEvent: () => Promise.resolve(true),
}));

vi.mock('@/lib/plaid-sync', () => ({
  getPlaidErrorDetails: () => null,
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

const OVERSIZED_BODY = 'x'.repeat(MAX_API_BODY_BYTES + 1);

async function loadApp() {
  const routeModule = await import('./route');
  const handler = routeModule.POST;
  return handler;
}

beforeEach(() => {
  state.auth = { userId: 'user_alice' };
  state.rateLimitCalls = [];
  state.insertCalls = 0;
  state.webhookVerifyCalls = 0;
});

afterEach(() => {
  vi.resetModules();
});

describe('API body-size limit', () => {
  it('rejects an oversized body with a JSON 413 before auth, rate limiting, or DB work', async () => {
    const handler = await loadApp();
    const response = await handler(
      new Request('http://localhost/api/accounts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: OVERSIZED_BODY,
      }),
    );

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ error: 'Request body too large' });
    expect(state.rateLimitCalls).toHaveLength(0);
    expect(state.insertCalls).toBe(0);
  });

  it('rejects an oversized chunked stream without a content-length header', async () => {
    const handler = await loadApp();
    const chunk = new TextEncoder().encode('y'.repeat(64 * 1024));
    const chunkCount = Math.ceil((MAX_API_BODY_BYTES + 1) / chunk.byteLength);
    let sent = 0;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (sent >= chunkCount) {
          controller.close();
          return;
        }
        sent += 1;
        controller.enqueue(chunk);
      },
    });

    const response = await handler(
      new Request('http://localhost/api/accounts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        // Node's fetch requires half-duplex for streamed request bodies.
        duplex: 'half',
      } as RequestInit & { duplex: 'half' }),
    );

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ error: 'Request body too large' });
    expect(state.insertCalls).toBe(0);
  });

  it('lets a normal-size request through to the route middleware chain', async () => {
    const handler = await loadApp();
    const response = await handler(
      new Request('http://localhost/api/accounts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Checking' }),
      }),
    );

    // The mocked rate limiter blocks, proving the request cleared the body
    // limit and reached the per-route middleware.
    expect(response.status).toBe(429);
    expect(state.rateLimitCalls.at(0)?.key).toBe('api:accounts:mutation:user:user_alice');
  });

  it('rejects an oversized webhook body before signature verification runs', async () => {
    const handler = await loadApp();
    const response = await handler(
      new Request('http://localhost/api/plaid/webhook', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'plaid-verification': 'some-token',
        },
        body: OVERSIZED_BODY,
      }),
    );

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ error: 'Request body too large' });
    expect(state.webhookVerifyCalls).toBe(0);
  });
});
