import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ErrorEvent } from '@sentry/nextjs';

import { redactString, scrubBreadcrumb, scrubEvent, scrubLog } from './sentry-scrub';

describe('redactString — credential shapes', () => {
  it('redacts a Clerk secret key', () => {
    expect(redactString('key is sk_live_abc123DEF456 tail')).toBe('key is [REDACTED] tail');
    expect(redactString('sk_test_deadBEEF00')).toBe('[REDACTED]');
  });

  it('redacts Plaid access/public/link tokens', () => {
    expect(redactString('token access-production-11112222-aaaa')).toBe('token [REDACTED]');
    expect(redactString('public-sandbox-xyz-123')).toBe('[REDACTED]');
    expect(redactString('link-development-abc')).toBe('[REDACTED]');
    expect(redactString('token access-sandbox-abc-123-def failed')).toBe(
      'token [REDACTED] failed',
    );
  });

  it('redacts a Postgres connection URL whole, host included', () => {
    // The host is part of the secret: it names the database server.
    expect(redactString('connect postgresql://user:pass@host:5432/db now')).toBe(
      'connect [REDACTED] now',
    );
    expect(redactString('postgres://u:p@h/d')).toBe('[REDACTED]');
  });

  it('redacts a bearer token but keeps the scheme, so the event still shows a credential was present', () => {
    expect(redactString('Authorization: Bearer abcDEF123.ghiJKL456')).toBe(
      'Authorization: Bearer [REDACTED]',
    );
    expect(redactString('Authorization: Bearer eyJhbGciOi')).toBe(
      'Authorization: Bearer [REDACTED]',
    );
  });

  it('leaves non-secret strings untouched', () => {
    const clean = 'Invalid account for user u_123 on 2026-07-28';
    expect(redactString(clean)).toBe(clean);
    expect(redactString('ITEM_LOGIN_REQUIRED for item abc')).toBe(
      'ITEM_LOGIN_REQUIRED for item abc',
    );
  });
});

describe('redactString — by env value', () => {
  const original = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = 'f'.repeat(64); // shapeless high-entropy secret
  });
  afterEach(() => {
    if (original === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = original;
  });

  it('redacts a raw secret env value even with no recognizable shape', () => {
    expect(redactString(`cron failed with ${'f'.repeat(64)} appended`)).toBe(
      'cron failed with [REDACTED] appended',
    );
  });

  it('ignores short env values to avoid over-redaction', () => {
    process.env.CRON_SECRET = 'abc'; // < 8 chars, must not be used as a needle
    expect(redactString('the abc cat')).toBe('the abc cat');
  });
});

describe('scrubEvent', () => {
  it('drops request headers/cookies/data and the query string', () => {
    const event = {
      request: {
        url: 'https://app.example.com/api/plaid/webhook?code=123',
        headers: { 'PLAID-SECRET': 'hush' },
        cookies: { __session: 'abc' },
        data: { access_token: 'access-sandbox-a-b' },
      },
    } as unknown as ErrorEvent;

    const scrubbed = scrubEvent(event);
    expect(scrubbed.request).toEqual({ url: 'https://app.example.com/api/plaid/webhook' });
  });

  it('redacts secrets nested through messages, exceptions, and extra', () => {
    const event = {
      message: 'boom access-production-secret-token',
      exception: {
        values: [
          { type: 'Error', value: 'db down: postgres://user:pw@host/db' },
          { type: 'Error', value: 'request failed with sk_live_secret99' },
        ],
      },
      extra: { note: 'used sk_live_leakedKey123', safe: 42 },
    } as unknown as ErrorEvent;

    const scrubbed = scrubEvent(event);

    expect(scrubbed.message).toBe('boom [REDACTED]');
    expect(scrubbed.exception?.values?.[0].value).toBe('db down: [REDACTED]');
    expect(scrubbed.exception?.values?.[1].value).toBe('request failed with [REDACTED]');
    const extra = scrubbed.extra as { note: string; safe: number };
    expect(extra.note).toBe('used [REDACTED]');
    expect(extra.safe).toBe(42);
  });

  it('blanks values under sensitive key names, keeping benign siblings', () => {
    // This is the layer that catches secrets with no recognizable shape and no
    // matching env value — e.g. a Plaid client_id copied into an Axios error.
    const event = {
      extra: {
        config: {
          headers: { 'PLAID-SECRET': 'hush', 'PLAID-CLIENT-ID': 'cid' },
          method: 'post',
        },
      },
      contexts: {
        axios: { authorization: 'opaque-value', status: 400 },
      },
    } as unknown as ErrorEvent;

    const scrubbed = scrubEvent(event);
    const extra = scrubbed.extra as { config: { headers: unknown; method: string } };
    expect(extra.config.headers).toEqual({
      'PLAID-SECRET': '[REDACTED]',
      'PLAID-CLIENT-ID': '[REDACTED]',
    });
    expect(extra.config.method).toBe('post');
    const axios = scrubbed.contexts?.axios as { authorization: string; status: number };
    expect(axios.authorization).toBe('[REDACTED]');
    expect(axios.status).toBe(400);
  });

  it('scrubs breadcrumbs carried on the event', () => {
    const event = {
      breadcrumbs: [{ message: 'fetch with Bearer abc123', data: { token: 'v' } }],
    } as unknown as ErrorEvent;

    const scrubbed = scrubEvent(event);
    expect(scrubbed.breadcrumbs?.[0].message).toBe('fetch with Bearer [REDACTED]');
    expect(scrubbed.breadcrumbs?.[0].data).toEqual({ token: '[REDACTED]' });
  });

  it('survives circular structures', () => {
    const loop: Record<string, unknown> = { note: 'ok' };
    loop.self = loop;
    const event = { extra: { loop } } as unknown as ErrorEvent;
    expect(() => scrubEvent(event)).not.toThrow();
  });
});

describe('scrubLog', () => {
  it('returns the same reference and survives cycles', () => {
    const log: Record<string, unknown> = { message: 'ok' };
    log.self = log; // cycle
    expect(() => scrubLog(log)).not.toThrow();
    expect(scrubLog(log)).toBe(log);
  });

  it('redacts secrets in structured log fields', () => {
    expect(scrubLog({ body: 'used sk_live_leaked1234' })).toEqual({ body: 'used [REDACTED]' });
  });
});

describe('scrubBreadcrumb', () => {
  it('redacts the message and sensitive data keys', () => {
    const crumb = scrubBreadcrumb({
      message: 'call postgresql://u:p@host/db',
      data: { cookie: 'session', path: '/api/summary' },
    });
    expect(crumb.message).toBe('call [REDACTED]');
    expect(crumb.data).toEqual({ cookie: '[REDACTED]', path: '/api/summary' });
  });
});
