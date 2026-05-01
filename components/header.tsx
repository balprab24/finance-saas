import { ClerkLoaded, ClerkLoading, UserButton } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';

import { HeaderLogo } from '@/components/header-logo';
import { Navigation } from '@/components/navigation';

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--aurex-border)] bg-[rgba(5,7,23,0.78)] backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] w-full max-w-screen-2xl items-center justify-between px-4 lg:px-14">
        <div className="flex items-center gap-x-10">
          <HeaderLogo />
          <Navigation />
        </div>
        <div className="flex items-center gap-3">
          <ClerkLoaded>
            <UserButton
              appearance={{
                elements: {
                  avatarBox:
                    'size-9 ring-1 ring-[var(--aurex-border-strong)] shadow-[0_0_0_3px_rgba(99,102,241,0.18)]',
                },
              }}
            />
          </ClerkLoaded>
          <ClerkLoading>
            <Loader2 className="size-6 animate-spin text-[var(--aurex-text-3)]" />
          </ClerkLoading>
        </div>
      </div>
    </header>
  );
}
