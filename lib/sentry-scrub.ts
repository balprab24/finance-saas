// Redacts secrets from Sentry payloads before they leave the process.
//
// `sendDefaultPii: false` already keeps Sentry from auto-attaching request
// bodies, cookies, and IPs — but exception *messages* are transmitted verbatim.
// A thrown error that interpolates a token, a Postgres URL, or the cron secret
// into its message would otherwise reach Sentry unredacted. This walks every
// string in an outgoing event/log and redacts:
//   (a) the runtime *values* of known secret env vars — so high-entropy secrets
//       with no fixed shape (e.g. CRON_SECRET) are caught by value; and
//   (b) well-known credential shapes (Clerk secret keys, Plaid tokens, Postgres
//       connection URLs, Authorization bearers) — caught by pattern.
//
// It is deliberately conservative: it only rewrites strings and never drops the
// event, so observability is preserved while secrets are masked.

const REDACTED = '[REDACTED]';
const MAX_DEPTH = 8;

// Env vars whose values must never appear in telemetry. Redacting by value is
// what catches shapeless secrets like CRON_SECRET and the encryption keyring.
// (On the browser these are undefined, so only the pattern rules apply there —
// which is correct, since none of these are ever exposed client-side.)
const SECRET_ENV_KEYS = [
  'CRON_SECRET',
  'CLERK_SECRET_KEY',
  'PLAID_SECRET',
  'PLAID_CLIENT_ID',
  'DATABASE_URL',
  'PLAID_TOKEN_ENCRYPTION_KEY',
  'PLAID_TOKEN_ENCRYPTION_KEYS',
  'SENTRY_AUTH_TOKEN',
];

// Shapes that are secret regardless of environment.
const SECRET_PATTERNS: RegExp[] = [
  /\bsk_(?:live|test)_[A-Za-z0-9]+/g, // Clerk secret key
  /\b(?:access|public|link)-(?:sandbox|development|production)-[A-Za-z0-9-]+/gi, // Plaid tokens
  /\bpostgres(?:ql)?:\/\/[^\s"'<>]+/gi, // Postgres connection URL (carries credentials)
  /\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/gi, // Authorization: Bearer <token>
];

function envSecretValues(): string[] {
  const values: string[] = [];
  for (const key of SECRET_ENV_KEYS) {
    const raw = process.env[key];
    const trimmed = raw?.trim();
    // Ignore short/empty values to avoid over-redacting common substrings.
    if (trimmed && trimmed.length >= 8) values.push(trimmed);
  }
  return values;
}

export function redactString(input: string): string {
  let out = input;
  for (const secret of envSecretValues()) {
    if (out.includes(secret)) out = out.split(secret).join(REDACTED);
  }
  for (const pattern of SECRET_PATTERNS) {
    out = out.replace(pattern, REDACTED);
  }
  return out;
}

// Deep-walks an object, redacting every string it contains. Mutates in place and
// returns the same reference (what Sentry's beforeSend/beforeSendLog expect). A
// WeakSet guards against cycles and a depth cap bounds cost on large payloads.
export function scrubValue<T>(value: T, depth = 0, seen: WeakSet<object> = new WeakSet()): T {
  if (typeof value === 'string') return redactString(value) as unknown as T;
  if (!value || typeof value !== 'object' || depth > MAX_DEPTH) return value;

  const obj = value as unknown as object;
  if (seen.has(obj)) return value;
  seen.add(obj);

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      value[i] = scrubValue(value[i], depth + 1, seen);
    }
    return value;
  }

  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    record[key] = scrubValue(record[key], depth + 1, seen);
  }
  return value;
}

// Sentry `beforeSend` hook: redact secrets from an outgoing error event.
export function scrubEvent<T>(event: T): T {
  return scrubValue(event);
}

// Sentry `beforeSendLog` hook: redact secrets from an outgoing structured log.
export function scrubLog<T>(log: T): T {
  return scrubValue(log);
}
