import { ClerkLoaded, ClerkLoading, UserButton } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';

import { HeaderLogo } from '@/components/header-logo';
import { Navigation } from '@/components/navigation';

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--aurex-border)] bg-[rgba(10,11,16,0.85)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-screen-2xl items-center justify-between px-4 lg:px-10">
        <div className="flex items-center gap-x-8">
          <HeaderLogo />
          <Navigation />
        </div>
        <div className="flex items-center gap-3">
          <ClerkLoaded>
            <UserButton
              appearance={{
                elements: { avatarBox: 'size-8' },
              }}
            />
          </ClerkLoaded>
          <ClerkLoading>
            <Loader2 className="size-5 animate-spin text-[var(--aurex-text-3)]" />
          </ClerkLoading>
        </div>
      </div>
    </header>
  );
}
