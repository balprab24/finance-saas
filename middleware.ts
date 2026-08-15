import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { buildCsp, generateCspNonce } from '@/lib/csp';

const isPublicRoute = createRouteMatcher([
  '/',
  '/privacy',
  '/terms',
  '/support',
  '/api/plaid/webhook',
  // Cron drain endpoint: enforces its own CRON_SECRET bearer check, so Clerk must
  // not intercept it. Not actually unauthenticated. Matched exactly — a future
  // cron route must be listed here deliberately rather than inheriting the bypass.
  '/api/cron/plaid-sync',
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  // Per-request nonce CSP; see lib/csp.ts for the policy rationale.
  const nonce = generateCspNonce();
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
