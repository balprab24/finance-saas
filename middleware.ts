import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/privacy',
  '/terms',
  '/support',
  '/api/plaid/webhook',
  // Cron drain endpoint: enforces its own CRON_SECRET bearer check, so Clerk must
  // not intercept it. Not actually unauthenticated.
  '/api/cron/(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

const isDev = process.env.NODE_ENV !== 'production';

// The CSP is built per-request so script-src can carry a nonce instead of
// 'unsafe-inline'. Next.js reads the nonce from the Content-Security-Policy
// *request* header and stamps it onto every script tag it renders; pages must
// therefore render dynamically (all app pages already do — the legal pages
// opt in via force-dynamic). 'strict-dynamic' lets those trusted scripts load
// Clerk/Plaid/Sentry chunks; the host allowlist and 'unsafe-inline' remain
// only as fallbacks for old browsers that ignore nonces, and are themselves
// ignored by browsers that support 'strict-dynamic'. Non-CSP security headers
// live in next.config.ts.
function buildCsp(nonce: string) {
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

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  const nonceBytes = crypto.getRandomValues(new Uint8Array(16));
  const nonce = btoa(String.fromCharCode(...nonceBytes));
  const csp = buildCsp(nonce);

  // Next.js extracts the nonce from the request's CSP header during render.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('content-security-policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('content-security-policy', csp);
  return response;
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
