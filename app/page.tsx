import Link from 'next/link';
import { ClerkLoaded, ClerkLoading, Show, UserButton } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';
import { LogoMark } from '@/components/brand/logo';
import { ScrollReveal } from '@/components/marketing/scroll-reveal';
import { ScrollSpyNav } from '@/components/marketing/scroll-spy-nav';
import {
  PreviewFlowChartLarge,
  PreviewFlowChartSmall,
} from '@/components/marketing/preview-flow-chart';
import {
  ArrowDownRight,
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
            glance — down to the cent.
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
                Start tracking — free
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
  return (
    <div className="aurex-card-marketing relative overflow-hidden p-4 sm:p-5">
      {/* Faux dashboard header */}
      <div className="flex items-center justify-between border-b border-[var(--aurex-border)] pb-4">
        <div className="flex items-center gap-2.5">
          <BrandMark size={26} />
          <div className="leading-tight">
            <div className="text-[13px] font-semibold text-[var(--aurex-text-1)]">Aurex</div>
            <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--aurex-text-3)]">
              Overview · May 2026
            </div>
          </div>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <span className="aurex-pill h-7 px-2.5 text-[11px]">
            <CalendarRange className="size-3" />
            Last 30 days
          </span>
          <span className="grid size-7 place-items-center rounded-full bg-[var(--aurex-brand)] text-[10px] font-semibold text-white">
            AX
          </span>
        </div>
      </div>

      {/* KPI strip */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <KpiTile
          label="Balance"
          value="$12,840.50"
          delta="+8.2%"
          trend="up"
          tone="brand"
        />
        <KpiTile
          label="Income"
          value="$8,420.00"
          delta="+12.4%"
          trend="up"
          tone="income"
        />
        <KpiTile
          label="Expenses"
          value="$3,879.50"
          delta="-3.1%"
          trend="down"
          tone="expense"
        />
      </div>

      {/* Chart + side rail */}
      <div className="mt-4 grid gap-3 lg:grid-cols-[1.55fr_1fr]">
        <PreviewFlowChartSmall />

        <div className="space-y-3">
          <RecentTransactions />
          <TopCategories />
        </div>
      </div>
    </div>
  );
}

function KpiTile({
  label,
  value,
  delta,
  trend,
  tone,
}: {
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down';
  tone: 'brand' | 'income' | 'expense';
}) {
  const toneMap = {
    brand: {
      ring: 'ring-[var(--aurex-border)]',
      icon: <WalletCards className="size-4 text-[#16181d]" />,
      iconBg: 'bg-[rgba(22,24,29,0.14)] ring-[rgba(22,24,29,0.28)]',
    },
    income: {
      ring: 'ring-[var(--aurex-border)]',
      icon: <ArrowUpRight className="size-4 text-[#117a4b]" />,
      iconBg: 'bg-[rgba(17,122,75,0.14)] ring-[rgba(17,122,75,0.3)]',
    },
    expense: {
      ring: 'ring-[var(--aurex-border)]',
      icon: <ArrowDownRight className="size-4 text-[#c0392b]" />,
      iconBg: 'bg-[rgba(192,57,43,0.14)] ring-[rgba(192,57,43,0.3)]',
    },
  }[tone];

  const deltaClass =
    trend === 'up'
      ? 'text-[#117a4b] bg-[rgba(17,122,75,0.12)] ring-[rgba(17,122,75,0.28)]'
      : 'text-[#c0392b] bg-[rgba(192,57,43,0.12)] ring-[rgba(192,57,43,0.28)]';

  return (
    <div className={`aurex-card-marketing relative overflow-hidden p-4 ring-1 ${toneMap.ring}`}>
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--aurex-text-3)]">
          {label}
        </span>
        <span className={`grid size-7 place-items-center rounded-md ring-1 ${toneMap.iconBg}`}>
          {toneMap.icon}
        </span>
      </div>
      <div className="mt-3 font-mono text-[24px] font-semibold tracking-tight tabular-nums text-[var(--aurex-text-1)]">
        {value}
      </div>
      <span
        className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${deltaClass}`}
      >
        {trend === 'up' ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
        {delta} vs last period
      </span>
    </div>
  );
}

function RecentTransactions() {
  const items = [
    { payee: 'Whole Foods', cat: 'Groceries', amt: '−$84.20', tone: 'expense' as const, color: '#c0392b' },
    { payee: 'Stripe Payout', cat: 'Income', amt: '+$2,400.00', tone: 'income' as const, color: '#117a4b' },
    { payee: 'Lyft', cat: 'Transport', amt: '−$22.50', tone: 'expense' as const, color: '#5b6470' },
    { payee: 'Spotify', cat: 'Subscriptions', amt: '−$11.99', tone: 'expense' as const, color: '#16181d' },
    { payee: 'Apple', cat: 'Tech', amt: '−$129.00', tone: 'expense' as const, color: '#16181d' },
  ];

  return (
    <div className="aurex-card-marketing p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[13px] font-semibold text-[var(--aurex-text-1)]">
          Recent transactions
        </div>
        <span className="text-[11px] text-[var(--aurex-text-3)]">5 latest</span>
      </div>
      <ul className="space-y-2.5">
        {items.map((t, i) => (
          <li
            key={t.payee}
            className="aurex-rise flex items-center justify-between rounded-lg px-2 py-1.5 transition-all duration-200 hover:translate-x-0.5 hover:bg-[var(--aurex-surface)]"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center gap-2.5">
              <span
                className="grid size-7 place-items-center rounded-md text-[10px] font-semibold uppercase"
                style={{ background: `${t.color}26`, color: t.color }}
              >
                {t.payee.slice(0, 2)}
              </span>
              <div className="leading-tight">
                <div className="text-[12.5px] font-medium text-[var(--aurex-text-1)]">{t.payee}</div>
                <div className="text-[10.5px] text-[var(--aurex-text-3)]">{t.cat}</div>
              </div>
            </div>
            <span
              className={`font-mono text-[12.5px] font-semibold tabular-nums ${
                t.tone === 'income' ? 'text-[#117a4b]' : 'text-[var(--aurex-text-1)]'
              }`}
            >
              {t.amt}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TopCategories() {
  const cats = [
    { name: 'Groceries', value: 78, color: '#16181d' },
    { name: 'Rent', value: 92, color: '#2b2f36' },
    { name: 'Dining', value: 54, color: '#16181d' },
    { name: 'Transport', value: 38, color: '#c0392b' },
  ];

  return (
    <div className="aurex-card-marketing p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[13px] font-semibold text-[var(--aurex-text-1)]">
          Top categories
        </div>
        <PieChart className="size-3.5 text-[var(--aurex-text-3)]" />
      </div>
      <ul className="space-y-2.5">
        {cats.map((c) => (
          <li key={c.name} className="space-y-1">
            <div className="flex items-center justify-between text-[11.5px]">
              <span className="text-[var(--aurex-text-1)]">{c.name}</span>
              <span className="font-mono tabular-nums text-[var(--aurex-text-3)]">{c.value}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--aurex-surface)]">
              <div
                className="h-full rounded-full"
                style={{ width: `${c.value}%`, background: c.color }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: '01',
      icon: Upload,
      title: 'Bring your transactions in',
      desc: 'Add accounts and rows by hand, or drop a CSV from your bank — Aurex parses it in your browser, no upload required.',
    },
    {
      n: '02',
      icon: Wand2,
      title: 'Sort spending by category',
      desc: 'Categorize as you go. Rename or split categories whenever your habits change — old transactions update with them.',
    },
    {
      n: '03',
      icon: LineChart,
      title: 'See where the money went',
      desc: 'Income, expenses, and the gap between — across every account, in one dashboard you can filter by date or account.',
    },
  ];

  return (
    <section id="preview" className="aurex-hairline relative py-16 sm:py-20 lg:py-24">
      <div className={`${SECTION} relative z-10`}>
        <div className="aurex-reveal mb-12 max-w-[640px]" data-reveal>
          <SectionEyebrow label="How it works" />
          <h2 className="font-display text-[34px] font-medium leading-[1.1] tracking-[-0.015em] text-[var(--aurex-text-1)] sm:text-[44px]">
            Bring it in. Sort it. Read it.
          </h2>
          <p className="mt-5 max-w-[520px] text-[16px] leading-[1.65] text-[var(--aurex-text-2)]">
            Aurex is deliberately simple. Three steps — and you stay in control
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

function SectionEyebrow({ label }: { label: string }) {
  return (
    <div className="mb-5 flex items-center gap-2.5">
      <span className="h-px w-6 bg-[var(--aurex-brand)]" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--aurex-text-3)]">
        {label}
      </span>
    </div>
  );
}

function InsightsSection() {
  return (
    <section id="insights" className="aurex-hairline relative py-16 sm:py-20 lg:py-24">
      <div className={`${SECTION} relative z-10`}>
        <div className="aurex-reveal" data-reveal>
          <SectionEyebrow label="Insights" />
          <h2 className="max-w-[680px] font-display text-[34px] font-medium leading-[1.1] tracking-[-0.015em] text-[var(--aurex-text-1)] sm:text-[44px]">
            Income, expenses,
            <br /> and the gap between.
          </h2>
          <p className="mt-5 max-w-[520px] text-[16px] leading-[1.65] text-[var(--aurex-text-2)]">
            Aurex renders every chart with Recharts and a finance-tuned palette —
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
            desc="A pie of expenses by category — plus a radial alternative so the chart matches the question you're asking."
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
            desc="Narrow the dashboard to a single account or a custom date range. The charts and totals update together — no stale numbers."
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
              browser — your data stays with you.
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
