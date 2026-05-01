import Link from 'next/link';
import { Loader2, CircleDollarSign, ShieldCheck } from 'lucide-react';
import { ClerkLoaded, ClerkLoading } from '@clerk/nextjs';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--aurex-bg)] text-[var(--aurex-text-1)]">
      <div className="aurex-mesh" aria-hidden />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 -z-0 h-[520px] w-[820px] -translate-x-1/2 rounded-full opacity-50 blur-[160px]"
        style={{
          background:
            'radial-gradient(closest-side, rgba(99,102,241,0.45), rgba(34,211,238,0.18) 60%, transparent 80%)',
        }}
      />
      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-6 py-6 lg:px-12">
          <Link href="/" className="flex items-center gap-2.5 text-[var(--aurex-text-1)]">
            <span
              className="grid size-9 place-items-center rounded-[10px] text-white shadow-[0_8px_24px_rgba(99,102,241,0.4)]"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 55%, #22d3ee 130%)',
              }}
            >
              <CircleDollarSign className="size-5" />
            </span>
            <span className="text-[18px] font-semibold tracking-tight">Aurex</span>
          </Link>
          <Link
            href="/"
            className="text-[13px] font-medium text-[var(--aurex-text-2)] transition-colors hover:text-[var(--aurex-text-1)]"
          >
            ← Back home
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center px-4 py-8">
          <div className="aurex-card relative w-full max-w-md p-8">
            <div className="mb-6 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--aurex-text-3)]">
              <ShieldCheck className="size-3.5 text-[#a5b4fc]" />
              Secured by Clerk
            </div>
            <ClerkLoaded>
              <div className="rounded-2xl bg-white p-1">{children}</div>
            </ClerkLoaded>
            <ClerkLoading>
              <div className="flex h-72 items-center justify-center">
                <Loader2 className="size-6 animate-spin text-[#a5b4fc]" />
              </div>
            </ClerkLoading>
          </div>
        </main>
        <footer className="px-6 py-6 text-center text-[13px] text-[var(--aurex-text-3)] lg:px-12">
          &copy; {new Date().getFullYear()} Aurex — Money, in clear view.
        </footer>
      </div>
    </div>
  );
}
