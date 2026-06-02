import { Header } from '@/components/header';
import { SheetProvider } from '@/providers/sheet-provider';

// Dashboard pages are per-user and driven by URL search params (from/to/accountId),
// so they must render dynamically. Without this, Next statically prerenders the
// tree and the client components reading useSearchParams bail to the loading.tsx
// Suspense boundary and get stuck on the skeleton. Instant tab-switch speed comes
// from the prefetched loading.tsx skeletons + React Query caching, not from static
// rendering — so keeping this dynamic costs us nothing perceptible.
export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--aurex-bg)] text-[var(--aurex-text-1)]">
      <Header />
      <SheetProvider />
      <main className="px-4 lg:px-10">{children}</main>
    </div>
  );
}
