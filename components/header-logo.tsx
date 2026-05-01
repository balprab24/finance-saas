import Link from 'next/link';
import { CircleDollarSign } from 'lucide-react';

export function HeaderLogo() {
  return (
    <Link href="/dashboard" className="group flex items-center gap-2.5">
      <span
        className="relative grid size-9 place-items-center rounded-[10px] text-white shadow-[0_8px_24px_rgba(99,102,241,0.4)] transition-transform duration-200 group-hover:-translate-y-0.5"
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 55%, #22d3ee 130%)',
        }}
      >
        <CircleDollarSign className="size-5" />
        <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[10px] ring-1 ring-white/30" />
      </span>
      <span className="text-[18px] font-semibold tracking-tight text-[var(--aurex-text-1)]">
        Aurex
      </span>
    </Link>
  );
}
