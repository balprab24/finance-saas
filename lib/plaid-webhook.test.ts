import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SignJWT, exportJWK, generateKeyPair } from 'jose';

const state: {
  keyGetCalls: number;
  jwk: Record<string, unknown> | null;
} = {
  keyGetCalls: 0,
  jwk: null,
};

vi.mock('@/lib/plaid', () => ({
  getPlaidClient: () => ({
    webhookVerificationKeyGet: () => {
      state.keyGetCalls += 1;
      return Promise.resolve({ data: { key: state.jwk } });
    },
  }),
}));

async function makeEs256Signer(kid: string) {
  const { publicKey, privateKey } = await generateKeyPair('ES256');
  const jwk = await exportJWK(publicKey);
  state.jwk = {
    alg: 'ES256',
    crv: jwk.crv,
    kid,
    kty: jwk.kty,
    use: 'sig',
    x: jwk.x,
    y: jwk.y,
    expired_at: null,
  };
  return privateKey;
}

beforeEach(() => {
  vi.resetModules();
  state.keyGetCalls = 0;
  state.jwk = null;
});

describe('verifyPlaidWebhookToken', () => {
  it('verifies a fresh ES256 token and returns its claims', async () => {
    const privateKey = await makeEs256Signer('kid-1');
    const token = await new SignJWT({ request_body_sha256: 'abc123' })
      .setProtectedHeader({ alg: 'ES256', kid: 'kid-1' })
      .setIssuedAt()
      .sign(privateKey);

    const { verifyPlaidWebhookToken } = await import('./plaid-webhook');
    const claims = await verifyPlaidWebhookToken(token);
    expect(claims.request_body_sha256).toBe('abc123');
    expect(state.keyGetCalls).toBe(1);
  });

  it('rejects a token signed with a non-ES256 algorithm', async () => {
    await makeEs256Signer('kid-1');
    const hmacSecret = new TextEncoder().encode('shared-secret-shared-secret-1234');
    const forged = await new SignJWT({ request_body_sha256: 'abc123' })
      .setProtectedHeader({ alg: 'HS256', kid: 'kid-1' })
      .setIssuedAt()
      .sign(hmacSecret);

    const { verifyPlaidWebhookToken } = await import('./plaid-webhook');
    await expect(verifyPlaidWebhookToken(forged)).rejects.toThrow();
  });

  it('rejects a stale token past the 5 minute age window', async () => {
    const privateKey = await makeEs256Signer('kid-1');
    const token = await new SignJWT({ request_body_sha256: 'abc123' })
      .setProtectedHeader({ alg: 'ES256', kid: 'kid-1' })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 10 * 60)
      .sign(privateKey);

    const { verifyPlaidWebhookToken } = await import('./plaid-webhook');
    await expect(verifyPlaidWebhookToken(token)).rejects.toThrow();
  });

  it('rejects a token without a kid before any Plaid key fetch', async () => {
    const privateKey = await makeEs256Signer('unused');
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: 'ES256' })
      .setIssuedAt()
      .sign(privateKey);

    const { verifyPlaidWebhookToken } = await import('./plaid-webhook');
    await expect(verifyPlaidWebhookToken(token)).rejects.toThrow(
      'Invalid Plaid webhook token',
    );
    expect(state.keyGetCalls).toBe(0);
  });
});
