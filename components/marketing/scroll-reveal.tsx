'use client';

import { useEffect } from 'react';

export function ScrollReveal() {
  useEffect(() => {
    // Gate the hidden start state on JS being present, so the reveal enhances an
    // already-visible default. Without this class (no JS, non-JS crawlers) the
    // [data-reveal] sections stay visible instead of shipping blank below the hero.
    document.documentElement.classList.add('aurex-js');

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const nodes = document.querySelectorAll<HTMLElement>('[data-reveal]');

    if (prefersReduced) {
      nodes.forEach((n) => n.classList.add('aurex-reveal-visible'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('aurex-reveal-visible');
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
    );

    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  return null;
}
