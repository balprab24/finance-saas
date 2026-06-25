import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const isDev = process.env.NODE_ENV !== 'production';

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https://img.clerk.com https://images.clerk.dev",
  "font-src 'self' data:",
  [
    "script-src 'self' 'unsafe-inline'",
    isDev ? "'unsafe-eval'" : '',
    'https://*.clerk.accounts.dev',
    'https://*.clerk.com',
    'https://cdn.plaid.com',
  ].filter(Boolean).join(' '),
  "style-src 'self' 'unsafe-inline'",
  [
    "connect-src 'self'",
    isDev ? 'ws: wss: http://localhost:* http://127.0.0.1:*' : '',
    'https://*.clerk.accounts.dev',
    'https://*.clerk.com',
    'https://*.plaid.com',
    'https://*.ingest.sentry.io',
    'https://*.ingest.us.sentry.io',
  ].filter(Boolean).join(' '),
  "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://cdn.plaid.com https://*.plaid.com",
  "worker-src 'self' blob:",
].join('; ');

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    const headers = [
      { key: 'Content-Security-Policy', value: csp },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
      },
    ];

    if (!isDev) {
      headers.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      });
    }

    return [{ source: '/(.*)', headers }];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
