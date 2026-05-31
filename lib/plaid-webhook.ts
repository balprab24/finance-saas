import { decodeProtectedHeader, importJWK, jwtVerify, type JWK } from 'jose';

import { getPlaidClient } from '@/lib/plaid';

const keyCache = new Map<string, { key: JWK; alg: string; expiredAt: number | null }>();

export async function verifyPlaidWebhookToken(token: string) {
  const header = decodeProtectedHeader(token);
  if (!header.kid || !header.alg) throw new Error('Invalid Plaid webhook token');

  let cached = keyCache.get(header.kid);
  if (!cached || (cached.expiredAt && cached.expiredAt * 1000 <= Date.now())) {
    const response = await getPlaidClient().webhookVerificationKeyGet({ key_id: header.kid });
    const key = response.data.key;

    cached = {
      key: {
        alg: key.alg,
        crv: key.crv,
        kid: key.kid,
        kty: key.kty,
        use: key.use,
        x: key.x,
        y: key.y,
      },
      alg: key.alg,
      expiredAt: key.expired_at,
    };
    keyCache.set(header.kid, cached);
  }

  const publicKey = await importJWK(cached.key, cached.alg);
  await jwtVerify(token, publicKey, { maxTokenAge: '5 min' });
}
