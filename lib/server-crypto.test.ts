import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  decryptSecret,
  encryptSecret,
  getActiveSecretVersion,
  reencryptSecret,
} from '@/lib/server-crypto';

const originalKey = process.env.PLAID_TOKEN_ENCRYPTION_KEY;
const originalKeys = process.env.PLAID_TOKEN_ENCRYPTION_KEYS;
const originalKeyVersion = process.env.PLAID_TOKEN_ENCRYPTION_KEY_VERSION;

beforeEach(() => {
  process.env.PLAID_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
  delete process.env.PLAID_TOKEN_ENCRYPTION_KEYS;
  delete process.env.PLAID_TOKEN_ENCRYPTION_KEY_VERSION;
});

afterEach(() => {
  process.env.PLAID_TOKEN_ENCRYPTION_KEY = originalKey;
  process.env.PLAID_TOKEN_ENCRYPTION_KEYS = originalKeys;
  process.env.PLAID_TOKEN_ENCRYPTION_KEY_VERSION = originalKeyVersion;
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

  it('decrypts old key versions and re-encrypts with the active version', () => {
    const v1 = Buffer.alloc(32, 1).toString('base64');
    const v2 = Buffer.alloc(32, 2).toString('base64');

    process.env.PLAID_TOKEN_ENCRYPTION_KEYS = `v1=${v1},v2=${v2}`;
    process.env.PLAID_TOKEN_ENCRYPTION_KEY_VERSION = 'v1';
    const oldPayload = encryptSecret('access-sandbox-123');

    process.env.PLAID_TOKEN_ENCRYPTION_KEY_VERSION = 'v2';
    const rotated = reencryptSecret(oldPayload);

    expect(getActiveSecretVersion()).toBe('v2');
    expect(oldPayload.startsWith('v1:')).toBe(true);
    expect(rotated.startsWith('v2:')).toBe(true);
    expect(decryptSecret(rotated)).toBe('access-sandbox-123');
  });
});
