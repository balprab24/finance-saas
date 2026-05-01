import { Header } from '@/components/header';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--aurex-bg)] text-[var(--aurex-text-1)]">
      <div className="aurex-mesh" aria-hidden />
      <div className="relative z-10">
        <Header />
        <main className="px-4 lg:px-14">{children}</main>
      </div>
    </div>
  );
}
