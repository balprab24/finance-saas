// Stage 2 (auth flow correctness): the post-auth "return to where you were headed"
// destination arrives as an attacker-influenceable `redirect_url` query param, so we
// only ever honor same-origin *relative* paths. Absolute URLs and protocol-relative
// `//host` targets are open-redirect / phishing vectors and must be rejected in favor
// of the caller's fallback. This is presentation-layer routing only; server-side
// middleware remains the real access gate.

// Reject control characters (code point <= 0x1F) and spaces, which can be used for
// CR/LF/tab/space smuggling in a redirect target.
function hasUnsafeChars(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    if (value.charCodeAt(i) <= 0x20) return true;
  }
  return false;
}

export function sanitizeRedirectPath(
  value: string | string[] | undefined | null,
): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;

  // Must be a root-relative path with a single leading slash.
  if (!raw.startsWith('/')) return null;
  // Reject protocol-relative (`//host`) and backslash-smuggled (`/\host`) targets;
  // some browsers normalize backslashes to slashes when navigating.
  if (raw.startsWith('//') || raw.startsWith('/\\')) return null;
  if (raw.includes('\\')) return null;
  // Reject anything carrying an explicit scheme.
  if (raw.includes('://')) return null;
  if (hasUnsafeChars(raw)) return null;

  // Never bounce back into the auth screens themselves — that would loop the
  // signed-in guard indefinitely.
  const path = raw.split(/[?#]/)[0];
  if (
    path === '/sign-in' ||
    path === '/sign-up' ||
    path.startsWith('/sign-in/') ||
    path.startsWith('/sign-up/')
  ) {
    return null;
  }

  return raw;
}
