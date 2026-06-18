'use client';

import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(callback: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

// SSR-safe `prefers-reduced-motion` read. `useSyncExternalStore` resolves the
// real client value on first paint (no hydration flash) and falls back to `false`
// on the server, so motion is opt-out, never forced on a user who asked to reduce it.
export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
