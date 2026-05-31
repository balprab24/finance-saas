import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const VERSION = 'v1';
const IV_BYTES = 12;

type Keyring = {
  activeVersion: string;
  keys: Map<string, Buffer>;
};

function decodeKey(name: string, raw: string) {
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error(`${name} must decode to 32 bytes`);
  }
  return key;
}

function getKeyring(): Keyring {
  const keys = new Map<string, Buffer>();
  const raw = process.env.PLAID_TOKEN_ENCRYPTION_KEY?.trim();
  if (raw) keys.set(VERSION, decodeKey('PLAID_TOKEN_ENCRYPTION_KEY', raw));

  const keyringRaw = process.env.PLAID_TOKEN_ENCRYPTION_KEYS?.trim();
  if (keyringRaw) {
    for (const entry of keyringRaw.split(',').map((part) => part.trim()).filter(Boolean)) {
      const [version, value] = entry.split('=');
      if (!version || !/^v\d+$/.test(version) || !value) {
        throw new Error('PLAID_TOKEN_ENCRYPTION_KEYS must use vN=base64 entries');
      }
      keys.set(version, decodeKey(`PLAID_TOKEN_ENCRYPTION_KEYS ${version}`, value));
    }
  }

  if (keys.size === 0) throw new Error('PLAID_TOKEN_ENCRYPTION_KEY is not set');

  const activeVersion = process.env.PLAID_TOKEN_ENCRYPTION_KEY_VERSION?.trim() || VERSION;
  if (!keys.has(activeVersion)) {
    throw new Error(`PLAID_TOKEN_ENCRYPTION_KEY_VERSION ${activeVersion} has no configured key`);
  }

  return { activeVersion, keys };
}

export function encryptSecret(plaintext: string) {
  const keyring = getKeyring();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', keyring.keys.get(keyring.activeVersion)!, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    keyring.activeVersion,
    iv.toString('base64url'),
    tag.toString('base64url'),
    encrypted.toString('base64url'),
  ].join(':');
}

export function decryptSecret(payload: string) {
  const [version, ivRaw, tagRaw, encryptedRaw] = payload.split(':');
  if (!version || !ivRaw || !tagRaw || !encryptedRaw) {
    throw new Error('Invalid encrypted secret payload');
  }

  const keyring = getKeyring();
  const key = keyring.keys.get(version);
  if (!key) throw new Error(`No Plaid token encryption key configured for ${version}`);

  const decipher = createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(ivRaw, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(tagRaw, 'base64url'));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

export function reencryptSecret(payload: string) {
  return encryptSecret(decryptSecret(payload));
}

export function getActiveSecretVersion() {
  return getKeyring().activeVersion;
}
