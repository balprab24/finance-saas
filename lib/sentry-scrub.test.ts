import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { redactString, scrubEvent, scrubLog } from './sentry-scrub';

describe('redactString', () => {
  it('redacts a Clerk secret key', () => {
    expect(redactString('key is sk_live_abc123DEF456 tail')).toBe('key is [REDACTED] tail');
    expect(redactString('sk_test_deadBEEF00')).toBe('[REDACTED]');
  });

  it('redacts Plaid access/public/link tokens', () => {
    expect(redactString('token access-production-11112222-aaaa')).toBe('token [REDACTED]');
    expect(redactString('public-sandbox-xyz-123')).toBe('[REDACTED]');
    expect(redactString('link-development-abc')).toBe('[REDACTED]');
  });

  it('redacts a Postgres connection URL with credentials', () => {
    expect(redactString('connect postgresql://user:pass@host:5432/db now')).toBe(
      'connect [REDACTED] now',
    );
    expect(redactString('postgres://u:p@h/d')).toBe('[REDACTED]');
  });

  it('redacts an Authorization bearer token', () => {
    expect(redactString('Authorization: Bearer abcDEF123.ghiJKL456')).toBe(
      'Authorization: [REDACTED]',
    );
  });

  it('leaves non-secret strings untouched', () => {
    const clean = 'Invalid account for user u_123 on 2026-07-28';
    expect(redactString(clean)).toBe(clean);
  });
});

describe('redactString by env value', () => {
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

describe('scrubEvent / scrubLog deep walk', () => {
  it('redacts secrets nested in an error event', () => {
    const event = {
      message: 'boom access-production-secret-token',
      exception: {
        values: [
          { type: 'Error', value: 'db down: postgres://user:pw@host/db' },
        ],
      },
      extra: { note: 'used sk_live_leakedKey123', safe: 42 },
      tags: ['a', 'Bearer tok12345678'],
    };

    const scrubbed = scrubEvent(event);

    expect(scrubbed.message).toBe('boom [REDACTED]');
    expect(scrubbed.exception.values[0].value).toBe('db down: [REDACTED]');
    expect(scrubbed.extra.note).toBe('used [REDACTED]');
    expect(scrubbed.extra.safe).toBe(42);
    expect(scrubbed.tags[1]).toBe('[REDACTED]');
  });

  it('returns the same reference and survives cycles', () => {
    const event: Record<string, unknown> = { message: 'ok' };
    event.self = event; // cycle
    expect(() => scrubLog(event)).not.toThrow();
    expect(scrubLog(event)).toBe(event);
  });
});
