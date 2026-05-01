'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useMedia } from '@/hooks/use-media';
import { Menu } from 'lucide-react';

import { NavButton } from '@/components/nav-button';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const routes = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/accounts', label: 'Accounts' },
  { href: '/categories', label: 'Categories' },
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useMedia('(max-width: 1024px)', false);

  const onClick = (href: string) => {
    router.push(href);
    setIsOpen(false);
  };

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
            {routes.map((route) => {
              const active = route.href === pathname;
              return (
                <button
                  key={route.href}
                  onClick={() => onClick(route.href)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[15px] font-medium transition-colors ${
                    active
                      ? 'bg-[var(--aurex-surface-hover)] text-[var(--aurex-text-1)] ring-1 ring-[var(--aurex-border-strong)]'
                      : 'text-[var(--aurex-text-2)] hover:bg-[var(--aurex-surface)] hover:text-[var(--aurex-text-1)]'
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      active ? 'bg-[#a5b4fc] shadow-[0_0_8px_#a5b4fc]' : 'bg-transparent'
                    }`}
                  />
                  {route.label}
                </button>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <nav className="hidden lg:flex items-center gap-1 overflow-x-auto">
      {routes.map((route) => (
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
