import Link from 'next/link';

import { LogoMark } from '@/components/brand/logo';

export function HeaderLogo() {
  return (
    <Link href="/dashboard" className="group flex items-center gap-2">
      <span className="transition-shadow duration-300 rounded-[10px] group-hover:shadow-[0_0_20px_rgba(99,102,241,0.45)]">
        <LogoMark size={30} />
      </span>
      <span className="text-[16px] font-semibold tracking-tight text-[var(--aurex-text-1)]">
        Aurex
      </span>
    </Link>
  );
}
