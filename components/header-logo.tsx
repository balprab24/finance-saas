import Link from 'next/link';

import { LogoMark } from '@/components/brand/logo';

export function HeaderLogo() {
  return (
    <Link href="/dashboard" className="group flex items-center gap-2">
      <LogoMark size={30} />
      <span className="text-[16px] font-semibold tracking-tight text-[var(--aurex-text-1)]">
        Aurex
      </span>
    </Link>
  );
}
