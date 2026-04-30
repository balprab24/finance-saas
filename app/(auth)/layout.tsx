import Link from 'next/link';
import { Loader2, CircleDollarSign } from 'lucide-react';
import { ClerkLoaded, ClerkLoading } from '@clerk/nextjs';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_55%),radial-gradient(circle_at_75%_85%,rgba(255,255,255,0.12),transparent_50%)]"
      />
      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-6 py-6 lg:px-12">
          <Link href="/" className="flex items-center gap-2 text-white">
            <CircleDollarSign className="size-7" />
            <span className="text-xl font-semibold tracking-tight">Finance</span>
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center px-4 py-8">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-black/5">
            <ClerkLoaded>{children}</ClerkLoaded>
            <ClerkLoading>
              <div className="flex h-72 items-center justify-center">
                <Loader2 className="size-6 animate-spin text-blue-600" />
              </div>
            </ClerkLoading>
          </div>
        </main>
        <footer className="px-6 py-6 text-center text-sm text-white/70 lg:px-12">
          &copy; {new Date().getFullYear()} Finance. Track every dollar with clarity.
        </footer>
      </div>
    </div>
  );
}
