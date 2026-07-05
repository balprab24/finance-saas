const isDev = process.env.NODE_ENV !== 'production';

// The CSP is built per-request (see middleware.ts) so script-src can carry a
// nonce instead of 'unsafe-inline'. Next.js reads the nonce from the
// Content-Security-Policy *request* header and stamps it onto every script
// tag it renders; pages must therefore render dynamically (all app pages
// already do — the legal pages opt in via force-dynamic). 'strict-dynamic'
// lets those trusted scripts load Clerk/Plaid/Sentry chunks; the host
// allowlist and 'unsafe-inline' remain only as fallbacks for old browsers
// that ignore nonces, and are themselves ignored by browsers that support
// 'strict-dynamic'. Non-CSP security headers live in next.config.ts.
export function buildCsp(nonce: string) {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: blob: https://img.clerk.com https://images.clerk.dev",
    "font-src 'self' data:",
    [
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
      "'unsafe-inline' https:",
      isDev ? "'unsafe-eval'" : '',
      'https://*.clerk.accounts.dev',
      'https://*.clerk.com',
      'https://cdn.plaid.com',
    ]
      .filter(Boolean)
      .join(' '),
    "style-src 'self' 'unsafe-inline'",
    [
      "connect-src 'self'",
      isDev ? 'ws: wss: http://localhost:* http://127.0.0.1:*' : '',
      'https://*.clerk.accounts.dev',
      'https://*.clerk.com',
      'https://*.plaid.com',
      'https://*.ingest.sentry.io',
      'https://*.ingest.us.sentry.io',
    ]
      .filter(Boolean)
      .join(' '),
    "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://cdn.plaid.com https://*.plaid.com",
    "worker-src 'self' blob:",
  ].join('; ');
}

export function generateCspNonce() {
  const nonceBytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...nonceBytes));
}
