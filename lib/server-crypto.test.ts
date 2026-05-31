import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { decryptSecret, encryptSecret } from '@/lib/server-crypto';

const originalKey = process.env.PLAID_TOKEN_ENCRYPTION_KEY;

beforeEach(() => {
  process.env.PLAID_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
});

afterEach(() => {
  process.env.PLAID_TOKEN_ENCRYPTION_KEY = originalKey;
});

describe('server secret encryption', () => {
  it('round-trips encrypted secrets without storing plaintext', () => {
    const encrypted = encryptSecret('access-sandbox-123');

    expect(encrypted).not.toContain('access-sandbox-123');
    expect(decryptSecret(encrypted)).toBe('access-sandbox-123');
  });

  it('uses a random iv for each encryption', () => {
    expect(encryptSecret('same-token')).not.toBe(encryptSecret('same-token'));
  });
});
