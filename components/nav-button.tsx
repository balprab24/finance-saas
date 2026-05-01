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
        'group relative inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-[14px] font-medium transition-all duration-200',
        isActive
          ? 'bg-[var(--aurex-surface-hover)] text-[var(--aurex-text-1)] ring-1 ring-[var(--aurex-border-strong)] shadow-[inset_0_0_0_1px_rgba(99,102,241,0.14),0_0_24px_-8px_rgba(99,102,241,0.4)]'
          : 'text-[var(--aurex-text-2)] hover:bg-[var(--aurex-surface)] hover:text-[var(--aurex-text-1)]',
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full transition-colors',
          isActive ? 'bg-[#a5b4fc] shadow-[0_0_8px_#a5b4fc]' : 'bg-transparent',
        )}
      />
      {label}
    </Link>
  );
}
