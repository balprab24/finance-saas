import { Header } from '@/components/header';
import { SheetProvider } from '@/providers/sheet-provider';

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
