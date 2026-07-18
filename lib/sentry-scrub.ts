// Redacts secrets from Sentry payloads before they leave the process.
//
// `sendDefaultPii: false` already keeps Sentry from auto-attaching request
// bodies, cookies, and IPs — but exception *messages* are transmitted verbatim,
// and the background sync path captures raw error objects
// (lib/plaid-sync-observability) where a Plaid/Axios error can carry
// PLAID-SECRET headers or access_token bodies in whatever shape an integration
// copied into the event. Scrubbing therefore happens here, at the transport
// boundary, rather than at each capture site.
//
// Three independent layers, because no single one is sufficient:
//   (a) the runtime *values* of known secret env vars — the only thing that
//       catches high-entropy secrets with no fixed shape (e.g. CRON_SECRET);
//   (b) well-known credential *shapes* (Clerk secret keys, Plaid tokens,
//       Postgres URLs, Authorization bearers) — catches secrets from any source,
//       including the browser where env values are unavailable; and
//   (c) sensitive *key names* — catches a secret whose value is neither a known
//       env value nor a recognizable shape (e.g. a Plaid client_id in `extra`).
//
// Beyond that, `request.headers` / `cookies` / `data` are dropped wholesale and
// query strings are stripped from URLs, since none of it is worth the risk.
//
// Must stay free of Node-only imports: instrumentation-client.ts ships this to
// the browser. Type-only Sentry imports are erased at build time.

import type { Breadcrumb, ErrorEvent } from '@sentry/nextjs';

const REDACTED = '[REDACTED]';
const MAX_DEPTH = 8;

// Env vars whose values must never appear in telemetry. Redacting by value is
// what catches shapeless secrets like CRON_SECRET and the encryption keyring.
// (On the browser these are undefined, so only layers (b) and (c) apply there —
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

// Shapes that are secret regardless of environment. `Bearer` keeps its prefix so
// a redacted event still shows *that* a credential was present.
const SECRET_PATTERNS: Array<[RegExp, string]> = [
  [/\bsk_(?:live|test)_[A-Za-z0-9]+/g, REDACTED], // Clerk secret key
  [/\b(?:access|public|link)-(?:sandbox|development|production)-[A-Za-z0-9-]+/gi, REDACTED], // Plaid tokens
  [/\bpostgres(?:ql)?:\/\/[^\s"'<>]+/gi, REDACTED], // Postgres URL (carries credentials)
  [/\bBearer\s+\S+/gi, `Bearer ${REDACTED}`], // Authorization: Bearer <token>
];

// Key names whose *value* is presumed secret whatever it looks like.
const SENSITIVE_KEY =
  /authorization|cookie|secret|token|password|api[-_]?key|client[-_]?id|plaid/i;

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
  for (const [pattern, replacement] of SECRET_PATTERNS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

// Deep-walks an object, redacting every string it contains and blanking any
// value under a sensitive key. Mutates in place and returns the same reference
// (what Sentry's beforeSend/beforeSendLog expect). A WeakSet guards against
// cycles and a depth cap bounds cost on large payloads.
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
    record[key] = SENSITIVE_KEY.test(key) ? REDACTED : scrubValue(record[key], depth + 1, seen);
  }
  return value;
}

// Sentry `beforeSend` hook: redact secrets from an outgoing error event.
export function scrubEvent<T extends ErrorEvent>(event: T): T {
  // Drop request metadata wholesale rather than trusting the walk to catch every
  // credential shape a header or body might carry.
  if (event.request) {
    delete event.request.headers;
    delete event.request.cookies;
    delete event.request.data;
    if (event.request.url) event.request.url = event.request.url.split('?')[0];
  }
  return scrubValue(event);
}

// Sentry `beforeSendLog` hook: redact secrets from an outgoing structured log.
export function scrubLog<T>(log: T): T {
  return scrubValue(log);
}

// Sentry `beforeBreadcrumb` hook. Breadcrumbs are attached to events that may
// never reach beforeSend (and carry their own fetch/xhr URLs), so they get
// scrubbed at their own hook too.
export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
  return scrubValue(breadcrumb);
}
