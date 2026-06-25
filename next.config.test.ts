import { describe, expect, it, vi } from 'vitest';

vi.mock('@sentry/nextjs', () => ({
  withSentryConfig: (config: unknown) => config,
}));

describe('next security headers', () => {
  it('sets baseline browser hardening headers for every route', async () => {
    const { default: nextConfig } = await import('./next.config');
    const config = nextConfig as {
      poweredByHeader?: boolean;
      headers?: () => Promise<Array<{ source: string; headers: Array<{ key: string; value: string }> }>>;
    };

    expect(config.poweredByHeader).toBe(false);
    const entries = await config.headers?.();
    const allRoutes = entries?.find((entry) => entry.source === '/(.*)');
    const headers = new Map(allRoutes?.headers.map((header) => [header.key, header.value]));

    expect(headers.get('Content-Security-Policy')).toContain("frame-ancestors 'none'");
    expect(headers.get('Content-Security-Policy')).toContain('https://cdn.plaid.com');
    expect(headers.get('Content-Security-Policy')).toContain('https://*.clerk.com');
    expect(headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(headers.get('X-Frame-Options')).toBe('DENY');
    expect(headers.get('Permissions-Policy')).toContain('camera=()');
  });
});
