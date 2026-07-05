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

    // The CSP is set per-request in middleware (nonce-based); next.config
    // carries only the static hardening headers.
    expect(headers.has('Content-Security-Policy')).toBe(false);
    expect(headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(headers.get('X-Frame-Options')).toBe('DENY');
    expect(headers.get('Permissions-Policy')).toContain('camera=()');
  });
});

describe('middleware content security policy', () => {
  it('builds a nonce + strict-dynamic script policy with vendor fallbacks', async () => {
    const { buildCsp } = await import('./lib/csp');
    const csp = buildCsp('test-nonce');

    expect(csp).toContain("script-src 'self' 'nonce-test-nonce' 'strict-dynamic'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain('https://cdn.plaid.com');
    expect(csp).toContain('https://*.clerk.com');
    // 'unsafe-inline' may appear only inside script-src as the legacy
    // fallback that nonce-supporting browsers ignore — and in style-src.
    const scriptSrc = csp.split('; ').find((d) => d.startsWith('script-src'))!;
    expect(scriptSrc).toContain("'unsafe-inline'");
    expect(scriptSrc).toContain("'nonce-");
  });

  it('generates unique base64 nonces', async () => {
    const { generateCspNonce } = await import('./lib/csp');
    const a = generateCspNonce();
    const b = generateCspNonce();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });
});
