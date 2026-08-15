const isDev = process.env.NODE_ENV !== 'production';

// A Clerk *production* instance serves its Frontend API from clerk.<your-domain>,
// which neither `*.clerk.com` nor `*.clerk.accounts.dev` matches. script-src
// survives that gap via 'strict-dynamic' (which lets the nonced Clerk script load
// its own chunks regardless of host), but 'strict-dynamic' has no effect on
// connect-src — so without this the browser blocks Clerk's XHR and sign-in breaks
// on the live domain while working perfectly in development.
//
// The origin is recoverable from the publishable key itself: everything after the
// pk_live_/pk_test_ prefix is the base64 of the frontend-API domain with a
// trailing '$'. Deriving it beats a second env var that can drift out of sync.
export function clerkFapiOrigin(
  publishableKey: string | undefined = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
): string | null {
  if (!publishableKey) return null;
  const encoded = publishableKey.replace(/^pk_(?:live|test)_/, '');
  if (encoded === publishableKey) return null; // not a recognizable Clerk key
  try {
    const domain = atob(encoded).replace(/\$+$/, '');
    // Guard against a malformed key widening the policy with junk.
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(domain)) {
      return null;
    }
    return `https://${domain}`;
  } catch {
    return null;
  }
}

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
  const clerkFapi = clerkFapiOrigin();
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
      clerkFapi ?? '',
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
      // Load-bearing in production: 'strict-dynamic' does not apply to connect-src.
      clerkFapi ?? '',
      'https://*.plaid.com',
      'https://*.ingest.sentry.io',
      'https://*.ingest.us.sentry.io',
      'https://*.ingest.de.sentry.io',
    ]
      .filter(Boolean)
      .join(' '),
    [
      "frame-src 'self'",
      'https://*.clerk.accounts.dev',
      'https://*.clerk.com',
      clerkFapi ?? '',
      'https://cdn.plaid.com',
      'https://*.plaid.com',
    ]
      .filter(Boolean)
      .join(' '),
    "worker-src 'self' blob:",
  ].join('; ');
}

export function generateCspNonce() {
  const nonceBytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...nonceBytes));
}
