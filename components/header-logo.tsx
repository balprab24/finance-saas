import Link from 'next/link';
import { CircleDollarSign } from 'lucide-react';

export function HeaderLogo() {
  return (
    <Link href="/dashboard" className="group flex items-center gap-2">
      <span className="grid size-8 place-items-center rounded-[8px] bg-[var(--aurex-brand)] text-white">
        <CircleDollarSign className="size-[18px]" />
      </span>
      <span className="text-[16px] font-semibold tracking-tight text-[var(--aurex-text-1)]">
        Aurex
      </span>
    </Link>
  );
}
