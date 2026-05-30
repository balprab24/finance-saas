import { describe, expect, it } from 'vitest';

import { sanitizeRedirectPath } from './auth-redirect';

describe('sanitizeRedirectPath', () => {
  it('accepts same-origin relative paths', () => {
    expect(sanitizeRedirectPath('/transactions')).toBe('/transactions');
    expect(sanitizeRedirectPath('/accounts?show=archived')).toBe(
      '/accounts?show=archived',
    );
    expect(sanitizeRedirectPath('/dashboard#kpis')).toBe('/dashboard#kpis');
  });

  it('uses the first value when given an array', () => {
    expect(sanitizeRedirectPath(['/transactions', '/evil'])).toBe(
      '/transactions',
    );
  });

  it('rejects empty / missing values', () => {
    expect(sanitizeRedirectPath(undefined)).toBeNull();
    expect(sanitizeRedirectPath(null)).toBeNull();
    expect(sanitizeRedirectPath('')).toBeNull();
    expect(sanitizeRedirectPath([])).toBeNull();
  });

  it('rejects absolute and scheme-bearing URLs', () => {
    expect(sanitizeRedirectPath('https://evil.com')).toBeNull();
    expect(sanitizeRedirectPath('http://evil.com/path')).toBeNull();
    expect(sanitizeRedirectPath('javascript:alert(1)')).toBeNull();
    expect(sanitizeRedirectPath('mailto:a@b.com')).toBeNull();
  });

  it('rejects protocol-relative and backslash-smuggled targets', () => {
    expect(sanitizeRedirectPath('//evil.com')).toBeNull();
    expect(sanitizeRedirectPath('/\\evil.com')).toBeNull();
    expect(sanitizeRedirectPath('/path\\to')).toBeNull();
  });

  it('rejects non-relative input', () => {
    expect(sanitizeRedirectPath('transactions')).toBeNull();
    expect(sanitizeRedirectPath('../etc/passwd')).toBeNull();
  });

  it('rejects control characters and whitespace', () => {
    expect(sanitizeRedirectPath('/path\nSet-Cookie: x')).toBeNull();
    expect(sanitizeRedirectPath('/path\twith-tab')).toBeNull();
    expect(sanitizeRedirectPath('/path with space')).toBeNull();
  });

  it('rejects loops back into the auth screens', () => {
    expect(sanitizeRedirectPath('/sign-in')).toBeNull();
    expect(sanitizeRedirectPath('/sign-up')).toBeNull();
    expect(sanitizeRedirectPath('/sign-in/factor-one')).toBeNull();
    expect(sanitizeRedirectPath('/sign-up?redirect_url=/x')).toBeNull();
  });
});
