'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMedia } from '@/hooks/use-media';
import { Menu } from 'lucide-react';

import { NavButton } from '@/components/nav-button';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const primaryRoutes = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/accounts', label: 'Accounts' },
  { href: '/banks', label: 'Banks' },
] as const;

const secondaryRoutes = [
  { href: '/categories', label: 'Categories' },
  { href: '/budgets', label: 'Budgets' },
  { href: '/insights', label: 'Insights' },
] as const;

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const isMobile = useMedia('(max-width: 1024px)', false);

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="border-[var(--aurex-border)] bg-[var(--aurex-surface)] text-[var(--aurex-text-1)] hover:bg-[var(--aurex-surface-hover)] hover:text-[var(--aurex-text-1)] focus-visible:ring-offset-0"
          >
            <Menu className="size-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="border-r border-[var(--aurex-border)] bg-[var(--aurex-bg-elev)] px-2">
          <nav className="flex flex-col gap-y-1.5 pt-8">
            {[primaryRoutes, secondaryRoutes].map((group, groupIndex) => (
              <div
                key={groupIndex}
                className={groupIndex === 1 ? 'mt-2 border-t border-[var(--aurex-border)] pt-2' : undefined}
              >
                {group.map((route) => {
                  const active = route.href === pathname;
                  return (
                    <Link
                      key={route.href}
                      href={route.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[15px] font-medium transition-colors ${
                        active
                          ? 'bg-[var(--aurex-surface-hover)] text-[var(--aurex-text-1)] ring-1 ring-[var(--aurex-border-strong)]'
                          : 'text-[var(--aurex-text-2)] hover:bg-[var(--aurex-surface)] hover:text-[var(--aurex-text-1)]'
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          active ? 'bg-[var(--aurex-ink)]' : 'bg-transparent'
                        }`}
                      />
                      {route.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <nav className="hidden lg:flex items-center gap-6 overflow-x-auto">
      {primaryRoutes.map((route) => (
        <NavButton
          key={route.href}
          href={route.href}
          label={route.label}
          isActive={pathname === route.href}
        />
      ))}
      <div className="h-5 w-px shrink-0 bg-[var(--aurex-border)]" aria-hidden />
      {secondaryRoutes.map((route) => (
        <NavButton
          key={route.href}
          href={route.href}
          label={route.label}
          isActive={pathname === route.href}
        />
      ))}
    </nav>
  );
}
