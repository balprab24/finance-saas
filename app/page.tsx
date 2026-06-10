import Link from 'next/link';
import { ClerkLoaded, ClerkLoading, Show, UserButton } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';
import { LogoMark } from '@/components/brand/logo';
import { ScrollReveal } from '@/components/marketing/scroll-reveal';
import { ScrollSpyNav } from '@/components/marketing/scroll-spy-nav';
import { PreviewFlowChartLarge } from '@/components/marketing/preview-flow-chart';
import { AUREX_COLORS } from '@/lib/colors';
import {
  ArrowRight,
  ArrowUpRight,
  CalendarRange,
  LineChart,
  Lock,
  PieChart,
  ShieldCheck,
  Sparkles,
  Upload,
  WalletCards,
  Wand2,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const SECTION = 'mx-auto w-full max-w-[1120px] px-6 sm:px-8 lg:px-14';
const SECTION_WIDE = 'mx-auto w-full max-w-[1360px] px-6 sm:px-8 lg:px-14';

function BrandMark({ size = 36 }: { size?: number }) {
  return <LogoMark size={size} />;
}

function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--aurex-border)] bg-[var(--aurex-bg-elev)]">
      <div className={`${SECTION_WIDE} flex h-[68px] items-center justify-between`}>
        <Link href="/" className="group flex items-center gap-2.5">
          <BrandMark size={30} />
          <span className="text-[18px] font-semibold tracking-tight text-[var(--aurex-text-1)]">
            Aurex
          </span>
        </Link>

        <ScrollSpyNav variant="desktop" />

        <div className="flex items-center gap-2">
          <Show when="signed-in">
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[var(--aurex-brand)] px-4 text-[15px] font-semibold text-white transition-colors hover:bg-[#2b2f36]"
            >
              Open dashboard
              <ArrowRight className="size-4" />
            </Link>
            <ClerkLoaded>
              <UserButton appearance={{ elements: { avatarBox: 'size-9' } }} />
            </ClerkLoaded>
            <ClerkLoading>
              <Loader2 className="size-5 animate-spin text-[var(--aurex-text-3)]" />
            </ClerkLoading>
          </Show>
          <Show when="signed-out">
            <Link
              href="/sign-in"
              className="inline-flex h-10 items-center px-3 text-[15px] font-medium text-[var(--aurex-text-1)]/85 transition-colors hover:text-[var(--aurex-text-1)]"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[var(--aurex-brand)] px-4 text-[15px] font-semibold text-white transition-colors hover:bg-[#2b2f36]"
            >
              Get started
              <ArrowRight className="size-4" />
            </Link>
          </Show>
        </div>
      </div>
      <ScrollSpyNav variant="mobile" />
    </header>
  );
}

function Hero() {
  return (
    <section className="aurex-hairline relative overflow-hidden">
      <div className="aurex-mesh" aria-hidden />

      <div className={`${SECTION_WIDE} relative z-10 grid gap-14 pt-16 pb-20 lg:grid-cols-[1.05fr_1.4fr] lg:gap-12 lg:pt-24 lg:pb-24`}>
        {/* Left column — copy */}
        <div className="flex flex-col items-start aurex-rise">
          <div className="mb-6 flex items-center gap-2.5">
            <span className="h-px w-6 bg-[var(--aurex-brand)]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--aurex-text-3)]">
              Personal finance workspace
            </span>
          </div>

          <h1 className="font-display text-[46px] font-medium leading-[1.04] tracking-[-0.02em] text-[var(--aurex-text-1)] sm:text-[60px] lg:text-[70px]">
            Every dollar,
            <br />
            accounted&nbsp;for.
          </h1>

          <p className="mt-7 max-w-[520px] text-[17px] leading-[1.6] text-[var(--aurex-text-2)] sm:text-[18px]">
            Aurex pulls every account, category, and transaction into one
            workspace. Import a CSV, set a filter, and read your month at a
            glance, down to the cent.
          </p>

          <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <Show when="signed-in">
              <Link href="/dashboard" className="aurex-button-primary">
                Open dashboard
                <ArrowRight className="size-4" />
              </Link>
            </Show>
            <Show when="signed-out">
              <Link href="/sign-up" className="aurex-button-primary">
                Start tracking, free
                <ArrowRight className="size-4" />
              </Link>
            </Show>
            <a href="#preview" className="aurex-button-ghost">
              See the dashboard
            </a>
          </div>

          <dl className="mt-10 grid w-full max-w-[470px] grid-cols-3 gap-6 border-t border-[var(--aurex-border)] pt-6">
            {[
              { value: 'CSV-native', label: 'Import in seconds' },
              { value: 'To the cent', label: 'Exact accounting' },
              { value: 'Private', label: 'Parsed in your browser' },
            ].map((s) => (
              <div key={s.label}>
                <dt className="font-display text-[19px] font-medium tracking-tight text-[var(--aurex-text-1)] after:mt-2 after:block after:h-px after:w-7 after:bg-[var(--aurex-brand)] after:content-['']">
                  {s.value}
                </dt>
                <dd className="mt-2 text-[12px] uppercase tracking-[0.1em] text-[var(--aurex-text-3)]">
                  {s.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Right column — dashboard preview */}
        <div className="relative">
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  const ledger = [
    { name: 'Groceries', amount: '$1,248.00', percent: 86 },
    { name: 'Rent', amount: '$1,950.00', percent: 100 },
    { name: 'Dining', amount: '$486.20', percent: 42 },
    { name: 'Transport', amount: '$195.30', percent: 18 },
  ];

  return (
    <div className="aurex-card-marketing relative overflow-hidden p-0">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--aurex-border)] p-4 sm:p-5">
        <div className="flex items-center gap-2.5">
          <BrandMark size={26} />
          <div className="leading-tight">
            <div className="text-[13px] font-semibold text-[var(--aurex-text-1)]">
              Statement
            </div>
            <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--aurex-text-3)]">
              May 1 - May 31
            </div>
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <span className="aurex-pill h-7 px-2.5 text-[11px]">
            <CalendarRange className="size-3" />
            Last 30 days
          </span>
          <span className="hidden size-7 place-items-center rounded-full bg-[var(--aurex-brand)] text-[10px] font-semibold text-white sm:grid">
            AX
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y divide-[var(--aurex-border)] lg:grid-cols-[1.08fr_0.92fr] lg:divide-x lg:divide-y-0">
        <section className="min-w-0 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[13px] font-medium text-[var(--aurex-text-3)]">
              Net this period
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-[var(--aurex-income-soft)] px-2 py-1 text-[11.5px] font-medium tabular-nums text-[var(--aurex-income)]">
              <ArrowUpRight className="size-3.5" />
              +8.2% vs last month
            </span>
          </div>

          <div className="mt-3 min-w-0 font-display text-[42px] font-semibold leading-none tracking-[-0.02em] tabular-nums [overflow-wrap:anywhere] text-[var(--aurex-text-1)] sm:text-[56px]">
            $4,540.50
          </div>

          <div className="mt-5 rounded-[10px] border border-[var(--aurex-border)] bg-[var(--aurex-surface)] p-3">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--aurex-text-3)]">
              In - Out = Net
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 font-mono text-[13px] font-semibold tabular-nums text-[var(--aurex-text-1)]">
              <span>
                <span className="mr-1 text-[var(--aurex-text-3)]">In</span>
                $8,420.00
              </span>
              <span className="text-[var(--aurex-text-3)]">-</span>
              <span>
                <span className="mr-1 text-[var(--aurex-text-3)]">Out</span>
                $3,879.50
              </span>
              <span className="text-[var(--aurex-text-3)]">=</span>
              <span>
                <span className="mr-1 text-[var(--aurex-text-3)]">Net</span>
                $4,540.50
              </span>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--aurex-border)] pt-4">
            <div className="text-[11.5px] text-[var(--aurex-text-3)]">
              as of May 31, 4:24 PM
            </div>
            <span className="inline-flex items-center gap-1 text-[12.5px] font-medium text-[var(--aurex-text-1)]">
              View transactions
              <ArrowRight className="size-3.5" />
            </span>
          </div>
        </section>

        <section className="min-w-0 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4 border-b border-[var(--aurex-border)] pb-3">
            <div>
              <h3 className="text-[15px] font-semibold tracking-tight text-[var(--aurex-text-1)]">
                Where it went
              </h3>
              <p className="mt-0.5 text-[11.5px] text-[var(--aurex-text-3)]">
                Ranked by spending
              </p>
            </div>
            <span className="font-mono text-[12.5px] font-semibold tabular-nums text-[var(--aurex-text-1)]">
              $3,879.50
            </span>
          </div>

          <ul className="mt-4 space-y-3">
            {ledger.map((item) => (
              <li key={item.name} className="space-y-1.5">
                <div className="flex min-w-0 items-center justify-between gap-3 text-[12.5px]">
                  <span className="truncate text-[var(--aurex-text-1)]">{item.name}</span>
                  <span className="shrink-0 font-mono font-semibold tabular-nums text-[var(--aurex-text-1)]">
                    {item.amount}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[var(--aurex-surface)]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${item.percent}%`,
                      backgroundColor: AUREX_COLORS.bar,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: '01',
      icon: Upload,
      title: 'Bring your transactions in',
      desc: 'Add accounts and rows by hand, or drop a CSV from your bank. Aurex parses it in your browser, no upload required.',
    },
    {
      n: '02',
      icon: Wand2,
      title: 'Sort spending by category',
      desc: 'Categorize as you go. Rename or split categories whenever your habits change, and old transactions update with them.',
    },
    {
      n: '03',
      icon: LineChart,
      title: 'See where the money went',
      desc: 'Income, expenses, and the gap between, across every account, in one dashboard you can filter by date or account.',
    },
  ];

  return (
    <section id="preview" className="aurex-hairline relative py-16 sm:py-20 lg:py-24">
      <div className={`${SECTION} relative z-10`}>
        <div className="aurex-reveal mb-12 max-w-[640px]" data-reveal>
          <h2 className="font-display text-[34px] font-medium leading-[1.1] tracking-[-0.015em] text-[var(--aurex-text-1)] sm:text-[44px]">
            Bring it in. Sort it. Read it.
          </h2>
          <p className="mt-5 max-w-[520px] text-[16px] leading-[1.65] text-[var(--aurex-text-2)]">
            Aurex is deliberately simple. Three steps, and you stay in control
            of your categories and accounts at every one.
          </p>
        </div>

        <div className="border-t border-[var(--aurex-border)]">
          {steps.map((s, i) => (
            <div
              key={s.n}
              className="aurex-reveal grid gap-4 border-b border-[var(--aurex-border)] py-8 sm:grid-cols-[auto_1fr] sm:gap-10"
              data-reveal
              style={{ ['--reveal-delay']: `${i * 100}ms` } as React.CSSProperties}
            >
              <div className="flex items-baseline gap-4 sm:w-[180px]">
                <span className="font-display text-[40px] font-medium leading-none tabular-nums text-[var(--aurex-brand-text)]">
                  {s.n}
                </span>
                <s.icon className="size-5 text-[var(--aurex-text-3)]" />
              </div>
              <div className="max-w-[620px]">
                <h3 className="font-display text-[22px] font-medium tracking-[-0.01em] text-[var(--aurex-text-1)]">
                  {s.title}
                </h3>
                <p className="mt-2.5 text-[15px] leading-[1.6] text-[var(--aurex-text-2)]">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function InsightsSection() {
  return (
    <section id="insights" className="aurex-hairline relative py-16 sm:py-20 lg:py-24">
      <div className={`${SECTION} relative z-10`}>
        <div className="aurex-reveal" data-reveal>
          <h2 className="max-w-[680px] font-display text-[34px] font-medium leading-[1.1] tracking-[-0.015em] text-[var(--aurex-text-1)] sm:text-[44px]">
            Income, expenses,
            <br /> and the gap between.
          </h2>
          <p className="mt-5 max-w-[520px] text-[16px] leading-[1.65] text-[var(--aurex-text-2)]">
            Aurex renders every chart with Recharts and a finance-tuned palette:
            green for income, red for expenses, graphite for everything in
            between. Toggle the visualization without losing your filter.
          </p>
        </div>
      </div>

      <div className={`${SECTION_WIDE} relative z-10 mt-8`}>
        <PreviewFlowChartLarge />
      </div>

      <div className={`${SECTION} relative z-10 mt-8 grid gap-10 md:grid-cols-2`}>
        <div className="aurex-reveal" data-reveal>
          <SmallFeature
            icon={PieChart}
            tag="Spending breakdown"
            title="See where the money went"
            desc="A pie of expenses by category, plus a radial alternative so the chart matches the question you're asking."
          />
        </div>
        <div
          className="aurex-reveal"
          data-reveal
          style={{ ['--reveal-delay']: '120ms' } as React.CSSProperties}
        >
          <SmallFeature
            icon={ShieldCheck}
            tag="Filter & focus"
            title="Account and date filters"
            desc="Narrow the dashboard to a single account or a custom date range. The charts and totals update together, with no stale numbers."
          />
        </div>
      </div>
    </section>
  );
}

function SmallFeature({
  icon: Icon,
  tag,
  title,
  desc,
}: {
  icon: typeof Sparkles;
  tag: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="aurex-card-marketing p-6">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--aurex-text-3)]">
        <Icon className="size-3.5 text-[var(--aurex-brand-text)]" />
        {tag}
      </div>
      <h4 className="font-display text-[20px] font-medium tracking-[-0.01em] text-[var(--aurex-text-1)]">
        {title}
      </h4>
      <p className="mt-2 text-[14.5px] leading-[1.6] text-[var(--aurex-text-2)]">
        {desc}
      </p>
    </div>
  );
}

function ImportSection() {
  return (
    <section id="import" className="aurex-hairline relative py-16 sm:py-20 lg:py-24">
      <div className={`${SECTION} relative z-10`}>
        <div
          className="aurex-card-marketing aurex-reveal relative p-8 sm:p-10 lg:p-12"
          data-reveal
        >
          <div className="relative flex flex-col items-start gap-4">
            <span className="grid size-10 place-items-center rounded-[10px] bg-[var(--aurex-surface)] ring-1 ring-[var(--aurex-border)]">
              <Upload className="size-[18px] text-[var(--aurex-brand-text)]" />
            </span>
            <h3 className="font-display text-[28px] font-medium tracking-[-0.015em] text-[var(--aurex-text-1)] sm:text-[36px]">
              Bring in CSV activity
            </h3>
            <p className="max-w-[560px] text-[16px] leading-[1.65] text-[var(--aurex-text-2)]">
              Drop a CSV from your bank, map the columns to date / amount /
              payee, and review the rows before saving. Parsing happens in the
              browser, so your data stays with you.
            </p>
          </div>
          <div className="relative mt-10 grid gap-8 border-t border-[var(--aurex-border)] pt-8 md:grid-cols-3">
            {[
              { stat: 'Drop', label: 'A CSV from any bank', icon: Upload },
              { stat: 'Map', label: 'Pick which columns mean what', icon: Wand2 },
              { stat: 'Review', label: 'Confirm rows before saving', icon: ShieldCheck },
            ].map((s, i) => (
              <div
                key={s.label}
                className="aurex-reveal flex items-start gap-3"
                data-reveal
                style={{ ['--reveal-delay']: `${i * 120}ms` } as React.CSSProperties}
              >
                <span className="mt-1 grid size-8 place-items-center rounded-md bg-[var(--aurex-surface)] ring-1 ring-[var(--aurex-border)]">
                  <s.icon className="size-4 text-[#16181d]" />
                </span>
                <div>
                  <div className="font-display text-[20px] font-medium tracking-tight text-[var(--aurex-text-1)]">
                    {s.stat}
                  </div>
                  <div className="mt-1 text-[13.5px] text-[var(--aurex-text-2)]">
                    {s.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBand() {
  const items = [
    { icon: Lock, label: 'Secure sign-in by Clerk' },
    { icon: ShieldCheck, label: 'Per-user workspace' },
    { icon: Upload, label: 'CSV parsed in your browser' },
    { icon: WalletCards, label: 'No automatic bank link' },
  ];
  return (
    <section id="privacy" className="aurex-hairline relative bg-[rgba(0,0,0,0.015)] py-14">
      <div className={`${SECTION} relative z-10 flex flex-wrap items-center justify-between gap-6`}>
        <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--aurex-text-3)]">
          Built around your privacy
        </span>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          {items.map((it, i) => (
            <span
              key={it.label}
              className="aurex-reveal inline-flex items-center gap-2.5 text-[13.5px] text-[var(--aurex-text-2)]"
              data-reveal
              style={{ ['--reveal-delay']: `${i * 80}ms` } as React.CSSProperties}
            >
              <span className="grid size-7 place-items-center rounded-md bg-[var(--aurex-surface)] ring-1 ring-[var(--aurex-border)]">
                <it.icon className="size-3.5 text-[#16181d]" />
              </span>
              {it.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBand() {
  return (
    <section className="relative py-16 sm:py-20 lg:py-24">
      <div className={`${SECTION} relative z-10 text-center`}>
        <h2
          className="aurex-reveal mx-auto max-w-[640px] font-display text-[38px] font-medium leading-[1.06] tracking-[-0.015em] text-[var(--aurex-text-1)] sm:text-[50px]"
          data-reveal
        >
          Your money, finally legible.
        </h2>
        <p
          className="aurex-reveal mx-auto mt-5 max-w-[520px] text-[16px] leading-[1.65] text-[var(--aurex-text-2)]"
          data-reveal
          style={{ ['--reveal-delay']: '120ms' } as React.CSSProperties}
        >
          Free to start. Import a CSV and you&rsquo;ll have your first dashboard
          in a couple of minutes.
        </p>
        <div
          className="aurex-reveal mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          data-reveal
          style={{ ['--reveal-delay']: '240ms' } as React.CSSProperties}
        >
          <Show when="signed-in">
            <Link href="/dashboard" className="aurex-button-primary">
              Open dashboard
              <ArrowRight className="size-4" />
            </Link>
          </Show>
          <Show when="signed-out">
            <Link href="/sign-up" className="aurex-button-primary">
              Create your workspace
              <ArrowRight className="size-4" />
            </Link>
            <Link href="/sign-in" className="aurex-button-ghost">
              Sign in
            </Link>
          </Show>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--aurex-border)] py-12">
      <div
        className={`${SECTION} flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between`}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark size={26} />
          <span className="text-[15px] font-semibold tracking-tight text-[var(--aurex-text-1)]">
            Aurex
          </span>
        </Link>
        <span className="text-[12.5px] text-[var(--aurex-text-3)]">
          © {new Date().getFullYear()} Aurex
        </span>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--aurex-bg)] text-[var(--aurex-text-1)] antialiased">
      <ScrollReveal />
      <NavBar />
      <Hero />
      <HowItWorks />
      <InsightsSection />
      <ImportSection />
      <TrustBand />
      <CtaBand />
      <Footer />
    </main>
  );
}
