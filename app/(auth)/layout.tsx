import Link from 'next/link';
import { Loader2, ShieldCheck } from 'lucide-react';
import { ClerkLoaded, ClerkLoading } from '@clerk/nextjs';

import { LogoMark } from '@/components/brand/logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--aurex-bg)] text-[var(--aurex-text-1)]">
      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-6 py-5 lg:px-10">
          <Link href="/" className="flex items-center gap-2 text-[var(--aurex-text-1)]">
            <LogoMark size={30} />
            <span className="text-[16px] font-semibold tracking-tight">Aurex</span>
          </Link>
          <Link
            href="/"
            className="text-[13px] font-medium text-[var(--aurex-text-3)] transition-colors hover:text-[var(--aurex-text-1)]"
          >
            ← Back home
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center px-4 py-6">
          <div className="aurex-card w-full max-w-md p-5 sm:p-7">
            <div className="mb-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--aurex-text-3)]">
              <ShieldCheck className="size-3.5 text-[var(--aurex-brand-text)]" />
              Secured by Clerk
            </div>
            <ClerkLoaded>{children}</ClerkLoaded>
            <ClerkLoading>
              <div className="flex h-72 items-center justify-center">
                <Loader2 className="size-5 animate-spin text-[var(--aurex-text-3)]" />
              </div>
            </ClerkLoading>
          </div>
        </main>
        <footer className="px-6 py-5 text-center text-[12.5px] text-[var(--aurex-text-3)] lg:px-10">
          &copy; {new Date().getFullYear()} Aurex
        </footer>
      </div>
    </div>
  );
}
