'use client';

import { useEffect, useState } from 'react';

const SECTIONS = [
  { href: '#preview', label: 'Product' },
  { href: '#insights', label: 'Insights' },
  { href: '#import', label: 'Import' },
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

    const io = new IntersectionObserver(
      (entries) => {
        const inBand = entries.filter((e) => e.isIntersecting);
        if (inBand.length === 0) return;
        const top = inBand.sort(
          (a, b) => b.intersectionRatio - a.intersectionRatio,
        )[0];
        setActive(`#${top.target.id}`);
      },
      { rootMargin: '-30% 0px -40% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  if (variant === 'desktop') {
    return (
      <nav className="hidden items-center gap-1 md:flex">
        {SECTIONS.map((s) => {
          const isActive = active === s.href;
          return (
            <a
              key={s.href}
              href={s.href}
              aria-current={isActive ? 'true' : undefined}
              className={`group relative inline-flex items-center rounded-full px-3.5 py-1.5 text-[15px] font-semibold tracking-[-0.005em] transition-colors duration-200 ${
                isActive
                  ? 'bg-[var(--aurex-surface)] text-[var(--aurex-text-1)]'
                  : 'text-[var(--aurex-text-1)]/85 hover:bg-[var(--aurex-surface)] hover:text-[var(--aurex-text-1)]'
              }`}
            >
              {s.label}
              <span
                className={`pointer-events-none absolute -bottom-0.5 left-1/2 h-px -translate-x-1/2 bg-[var(--aurex-brand)] transition-all duration-300 ${
                  isActive ? 'w-6' : 'w-0 group-hover:w-6'
                }`}
              />
            </a>
          );
        })}
      </nav>
    );
  }

  return (
    <div className="md:hidden">
      <div className="flex gap-1.5 overflow-x-auto px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SECTIONS.map((s) => {
          const isActive = active === s.href;
          return (
            <a
              key={s.href}
              href={s.href}
              aria-current={isActive ? 'true' : undefined}
              className={`inline-flex h-8 shrink-0 items-center rounded-full px-3 text-[13px] font-medium ring-1 transition-colors duration-200 ${
                isActive
                  ? 'bg-[rgba(22, 24, 29,0.18)] text-[var(--aurex-text-1)] ring-[rgba(22, 24, 29,0.4)]'
                  : 'bg-[var(--aurex-surface)] text-[var(--aurex-text-1)]/85 ring-[var(--aurex-border)]'
              }`}
            >
              {s.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}
