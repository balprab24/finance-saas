import Link from 'next/link';
import { cn } from '@/lib/utils';

type Props = {
  href: string;
  label: string;
  isActive?: boolean;
};

export function NavButton({ href, label, isActive }: Props) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex h-8 items-center rounded-md px-3 text-[13.5px] font-medium transition-colors',
        isActive
          ? 'bg-[var(--aurex-surface-hover)] text-[var(--aurex-text-1)]'
          : 'text-[var(--aurex-text-2)] hover:bg-[var(--aurex-surface)] hover:text-[var(--aurex-text-1)]',
      )}
    >
      {label}
    </Link>
  );
}
