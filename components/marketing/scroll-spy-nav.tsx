'use client';

import { useEffect, useState } from 'react';

const SECTIONS = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#accounts', label: 'Accounts' },
  { href: '#privacy', label: 'Privacy' },
] as const;

type Variant = 'desktop' | 'mobile';

export function ScrollSpyNav({ variant }: { variant: Variant }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const targets = SECTIONS.map((s) => document.querySelector(s.href)).filter(
      (n): n is Element => !!n,
    );
    if (targets.length === 0) return;

    // Track the latest visibility of every section, not just this batch of
    // entries. When none is in the band (hero, closing footer) the active state
    // clears instead of holding a stale highlight.
    const ratios = new Map<string, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          ratios.set(`#${e.target.id}`, e.isIntersecting ? e.intersectionRatio : 0);
        }
        let best: string | null = null;
        let bestRatio = 0;
        for (const [href, ratio] of ratios) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            best = href;
          }
        }
        setActive(best);
      },
      { rootMargin: '-30% 0px -40% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  if (variant === 'desktop') {
    return (
      <nav className="hidden items-center gap-6 md:flex">
        {SECTIONS.map((s) => {
          const isActive = active === s.href;
          return (
            <a
              key={s.href}
              href={s.href}
              aria-current={isActive ? 'location' : undefined}
              className={`group relative inline-flex h-10 items-center text-[15px] font-semibold tracking-[-0.005em] transition-colors duration-200 ${
                isActive
                  ? 'text-[var(--aurex-text-1)]'
                  : 'text-[var(--aurex-text-3)] hover:text-[var(--aurex-text-1)]'
              }`}
            >
              {s.label}
              <span
                className={`pointer-events-none absolute bottom-0 left-0 h-px bg-[var(--aurex-brand)] transition-all duration-300 ${
                  isActive ? 'w-full' : 'w-0 group-hover:w-full'
                }`}
              />
            </a>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="border-t border-[var(--aurex-border)] md:hidden">
      <div className="mx-auto grid h-10 max-w-[520px] grid-cols-3 px-4">
        {SECTIONS.map((s) => {
          const isActive = active === s.href;
          return (
            <a
              key={s.href}
              href={s.href}
              aria-current={isActive ? 'location' : undefined}
              className={`relative inline-flex min-w-0 items-center justify-center px-2 text-[14px] font-semibold transition-colors duration-200 ${
                isActive
                  ? 'text-[var(--aurex-text-1)]'
                  : 'text-[var(--aurex-text-3)]'
              }`}
            >
              {s.label}
              <span
                className={`absolute inset-x-2 bottom-0 h-px bg-[var(--aurex-ink)] transition-opacity ${
                  isActive ? 'opacity-100' : 'opacity-0'
                }`}
                aria-hidden
              />
            </a>
          );
        })}
      </div>
    </nav>
  );
}
