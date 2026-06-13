import Link from 'next/link';
import { cn } from '@/lib/utils';

type Props = {
  href: string;
  label: string;
  isActive?: boolean;
};

// Mirrors the landing nav (components/marketing/scroll-spy-nav.tsx): the active
// route is ink with a full-width underline in the brand ink; inactive routes are
// muted and grow the underline on hover. Keeps the logged-in chrome continuous
// with the marketing site instead of a separate filled-pill vocabulary.
export function NavButton({ href, label, isActive }: Props) {
  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'group relative inline-flex h-14 shrink-0 items-center px-1 text-[14px] font-medium tracking-[-0.005em] transition-colors duration-200',
        isActive
          ? 'text-[var(--aurex-text-1)]'
          : 'text-[var(--aurex-text-3)] hover:text-[var(--aurex-text-1)]',
      )}
    >
      {label}
      <span
        className={cn(
          'pointer-events-none absolute -bottom-px left-0 h-0.5 bg-[var(--aurex-brand)] transition-all duration-300',
          isActive ? 'w-full' : 'w-0 group-hover:w-full',
        )}
      />
    </Link>
  );
}
