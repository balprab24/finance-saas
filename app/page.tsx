import Link from 'next/link';
import { Show } from '@clerk/nextjs';
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
  CircleDollarSign,
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
  return (
    <span
      className="relative inline-grid place-items-center rounded-[12px] text-white shadow-[0_8px_28px_rgba(99,102,241,0.45)]"
      style={{
        width: size,
        height: size,
        background:
          'linear-gradient(135deg, #6366f1 0%, #8b5cf6 55%, #22d3ee 130%)',
      }}
    >
      <CircleDollarSign className="size-[60%]" />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[12px] ring-1 ring-white/30"
      />
    </span>
  );
}

function NavBar() {
  return (
    <header className="sticky top-0 z-50 bg-gradient-to-b from-[rgba(10,11,16,0.85)] to-[rgba(10,11,16,0.7)] shadow-[0_1px_0_rgba(99,102,241,0.08),0_8px_24px_rgba(0,0,0,0.4)] backdrop-blur-xl">
      <div className={`${SECTION_WIDE} flex h-[68px] items-center justify-between`}>
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="inline-block transition-shadow duration-300 rounded-[12px] group-hover:shadow-[0_0_24px_rgba(99,102,241,0.5)]">
            <BrandMark size={30} />
          </span>
          <span className="text-[18px] font-semibold tracking-tight text-[var(--aurex-text-1)] transition-colors duration-200 group-hover:text-white">
            Aurex
          </span>
        </Link>

        <ScrollSpyNav variant="desktop" />

        <div className="flex items-center gap-2">
          <Show when="signed-in">
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] px-4 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(99,102,241,0.35)] transition-transform hover:-translate-y-0.5"
            >
              Open dashboard
              <ArrowRight className="size-4" />
            </Link>
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
              className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] px-4 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(99,102,241,0.35)] transition-transform hover:-translate-y-0.5"
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
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-32 -z-0 h-[520px] w-[820px] -translate-x-1/2 rounded-full opacity-50 blur-[160px]"
        style={{
          background:
            'radial-gradient(closest-side, rgba(139,92,246,0.45), rgba(34,211,238,0.18) 60%, transparent 80%)',
        }}
      />
      <div
        aria-hidden
        className="aurex-aurora aurex-aurora-violet -bottom-40 left-1/2 h-[320px] w-[640px] -translate-x-1/2 opacity-35"
      />

      <div className={`${SECTION_WIDE} relative z-10 grid gap-14 pt-16 pb-20 lg:grid-cols-[1.05fr_1.4fr] lg:gap-12 lg:pt-24 lg:pb-24`}>
        {/* Left column — copy */}
        <div className="flex flex-col items-start aurex-rise">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--aurex-border-strong)] bg-[var(--aurex-surface)] px-3 py-1.5 text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--aurex-text-2)]">
            <Sparkles className="size-3.5 text-[#a5b4fc]" />
            New — Aurex 1.0
          </span>

          <h1 className="text-[44px] font-semibold leading-[1.02] tracking-[-0.025em] text-[var(--aurex-text-1)] sm:text-[58px] lg:text-[68px]">
            Money,{' '}
            <span className="bg-gradient-to-br from-[#a5b4fc] via-[#8b5cf6] to-[#22d3ee] bg-clip-text text-transparent">
              in&nbsp;clear&nbsp;view.
            </span>
          </h1>

          <p className="mt-6 max-w-[520px] text-[17px] leading-[1.6] text-[var(--aurex-text-2)] sm:text-[18px]">
            Aurex turns every account, category, and transaction into one
            beautiful dashboard. Import a CSV, apply a filter, and watch
            balances, income, and spending tell the whole story.
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

          <dl className="mt-10 grid w-full max-w-[460px] grid-cols-3 gap-6 border-t border-[var(--aurex-border)] pt-6">
            {[
              { value: '6 charts', label: 'Visualizations' },
              { value: 'CSV', label: 'Import in seconds' },
              { value: 'Clerk', label: 'Sign-in handled for you' },
            ].map((s) => (
              <div key={s.label}>
                <dt className="text-[20px] font-semibold tracking-tight text-[var(--aurex-text-1)] after:mt-1.5 after:block after:h-px after:w-8 after:bg-gradient-to-r after:from-[#a5b4fc] after:to-[#22d3ee] after:content-['']">
                  {s.value}
                </dt>
                <dd className="mt-1.5 text-[12px] uppercase tracking-[0.1em] text-[var(--aurex-text-3)]">
                  {s.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Right column — dashboard preview */}
        <div className="relative">
          <div
            aria-hidden
            className="absolute -inset-6 -z-10 rounded-[28px] opacity-70 blur-[60px]"
            style={{
              background:
                'radial-gradient(60% 60% at 50% 30%, rgba(99,102,241,0.5), rgba(34,211,238,0.18) 50%, transparent 80%)',
            }}
          />
          <div className="aurex-float">
            <DashboardPreview />
          </div>
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
          <span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-[#6366f1] to-[#22d3ee] text-[10px] font-semibold text-white">
            PB
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
      ring: 'ring-[rgba(99,102,241,0.28)]',
      glow: '0 0 30px rgba(99,102,241,0.28)',
      icon: <WalletCards className="size-4 text-[#a5b4fc]" />,
      iconBg: 'bg-[rgba(99,102,241,0.18)] ring-[rgba(99,102,241,0.32)]',
    },
    income: {
      ring: 'ring-[rgba(52,211,153,0.28)]',
      glow: '0 0 30px rgba(52,211,153,0.32)',
      icon: <ArrowUpRight className="size-4 text-[#34d399]" />,
      iconBg: 'bg-[rgba(52,211,153,0.16)] ring-[rgba(52,211,153,0.34)]',
    },
    expense: {
      ring: 'ring-[rgba(251,113,133,0.28)]',
      glow: '0 0 30px rgba(251,113,133,0.32)',
      icon: <ArrowDownRight className="size-4 text-[#fb7185]" />,
      iconBg: 'bg-[rgba(251,113,133,0.16)] ring-[rgba(251,113,133,0.34)]',
    },
  }[tone];

  const deltaClass =
    trend === 'up'
      ? 'text-[#34d399] bg-[rgba(52,211,153,0.12)] ring-[rgba(52,211,153,0.28)]'
      : 'text-[#fb7185] bg-[rgba(251,113,133,0.12)] ring-[rgba(251,113,133,0.28)]';

  return (
    <div
      className={`aurex-card-marketing relative overflow-hidden p-4 ring-1 ${toneMap.ring}`}
      style={{ boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05), ${toneMap.glow}` }}
    >
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--aurex-text-3)]">
          {label}
        </span>
        <span className={`grid size-7 place-items-center rounded-md ring-1 ${toneMap.iconBg}`}>
          {toneMap.icon}
        </span>
      </div>
      <div className="mt-3 text-[26px] font-semibold tracking-tight text-[var(--aurex-text-1)]">
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
    { payee: 'Whole Foods', cat: 'Groceries', amt: '−$84.20', tone: 'expense' as const, color: '#fb7185' },
    { payee: 'Stripe Payout', cat: 'Income', amt: '+$2,400.00', tone: 'income' as const, color: '#34d399' },
    { payee: 'Lyft', cat: 'Transport', amt: '−$22.50', tone: 'expense' as const, color: '#22d3ee' },
    { payee: 'Spotify', cat: 'Subscriptions', amt: '−$11.99', tone: 'expense' as const, color: '#8b5cf6' },
    { payee: 'Apple', cat: 'Tech', amt: '−$129.00', tone: 'expense' as const, color: '#fbbf24' },
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
                className="grid size-7 place-items-center rounded-md text-[10px] font-semibold uppercase text-white/90"
                style={{ background: `${t.color}33`, color: t.color, boxShadow: `0 0 12px ${t.color}33` }}
              >
                {t.payee.slice(0, 2)}
              </span>
              <div className="leading-tight">
                <div className="text-[12.5px] font-medium text-[var(--aurex-text-1)]">{t.payee}</div>
                <div className="text-[10.5px] text-[var(--aurex-text-3)]">{t.cat}</div>
              </div>
            </div>
            <span
              className={`text-[12.5px] font-semibold tabular-nums ${
                t.tone === 'income' ? 'text-[#34d399]' : 'text-[var(--aurex-text-1)]'
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
    { name: 'Groceries', value: 78, color: '#6366f1' },
    { name: 'Rent', value: 92, color: '#22d3ee' },
    { name: 'Dining', value: 54, color: '#fb7185' },
    { name: 'Transport', value: 38, color: '#fbbf24' },
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
              <span className="text-[var(--aurex-text-3)]">{c.value}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--aurex-surface)]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${c.value}%`,
                  background: `linear-gradient(90deg, ${c.color}, ${c.color}cc)`,
                  boxShadow: `0 0 10px ${c.color}66`,
                }}
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
    <section id="preview" className="aurex-hairline relative overflow-hidden py-16 sm:py-20 lg:py-24">
      <div
        aria-hidden
        className="aurex-aurora aurex-aurora-cyan -right-40 top-1/4 h-[420px] w-[520px] opacity-25"
      />
      <div className={`${SECTION} relative z-10`}>
        <div className="aurex-reveal mb-10 max-w-[640px]" data-reveal>
          <SectionEyebrow icon={Sparkles} label="How it works" />
          <h2 className="text-[34px] font-semibold leading-[1.1] tracking-[-0.02em] text-[var(--aurex-text-1)] sm:text-[44px]">
            Three steps to a{' '}
            <span className="bg-gradient-to-br from-[#a5b4fc] to-[#22d3ee] bg-clip-text text-transparent">
              clearer picture.
            </span>
          </h2>
          <p className="mt-5 max-w-[520px] text-[16px] leading-[1.65] text-[var(--aurex-text-2)]">
            Aurex is straightforward by design. Bring your money in, sort it,
            then read it. You stay in control of categories and accounts at
            every step.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={s.n}
              className="aurex-card-marketing aurex-reveal p-6"
              data-reveal
              style={{ ['--reveal-delay']: `${i * 120}ms` } as React.CSSProperties}
            >
              <div className="mb-5 flex items-center justify-between">
                <div
                  className="inline-grid size-11 place-items-center rounded-[12px] text-white"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(34,211,238,0.25))',
                    boxShadow:
                      'inset 0 0 0 1px rgba(99,102,241,0.4), 0 8px 24px rgba(99,102,241,0.18)',
                  }}
                >
                  <s.icon className="size-5" />
                </div>
                <span className="bg-gradient-to-br from-[#a5b4fc] to-[#22d3ee] bg-clip-text font-mono text-[13px] font-semibold tracking-[0.08em] text-transparent">
                  {s.n}
                </span>
              </div>
              <h3 className="text-[17px] font-semibold tracking-tight text-[var(--aurex-text-1)]">
                {s.title}
              </h3>
              <p className="mt-2.5 text-[14.5px] leading-[1.6] text-[var(--aurex-text-2)]">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionEyebrow({
  icon: Icon,
  label,
}: {
  icon: typeof Sparkles;
  label: string;
}) {
  return (
    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--aurex-border)] bg-[var(--aurex-surface)] px-3 py-1">
      <Icon className="size-3.5 text-[#a5b4fc]" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--aurex-text-2)]">
        {label}
      </span>
    </div>
  );
}

function InsightsSection() {
  return (
    <section id="insights" className="aurex-hairline relative overflow-hidden py-16 sm:py-20 lg:py-24">
      <div
        aria-hidden
        className="aurex-aurora aurex-aurora-violet left-1/2 top-1/3 h-[520px] w-[820px] -translate-x-1/2 opacity-25"
      />
      <div className={`${SECTION} relative z-10`}>
        <div className="aurex-reveal" data-reveal>
          <SectionEyebrow icon={LineChart} label="Insights" />
          <h2 className="max-w-[680px] text-[34px] font-semibold leading-[1.1] tracking-[-0.02em] text-[var(--aurex-text-1)] sm:text-[44px]">
            Income, expenses,
            <br /> and the gap between.
          </h2>
          <p className="mt-5 max-w-[520px] text-[16px] leading-[1.65] text-[var(--aurex-text-2)]">
            Aurex renders every chart with Recharts and a finance-tuned palette —
            emerald for income, rose for expenses, indigo for everything in
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
            desc="A pie of expenses by category — plus radar and radial alternatives so the chart matches the question you're asking."
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
      <div className="mb-4 inline-grid size-10 place-items-center rounded-[10px] bg-[rgba(99,102,241,0.16)] ring-1 ring-[rgba(99,102,241,0.32)]">
        <Icon className="size-4.5 text-[#a5b4fc]" />
      </div>
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--aurex-text-3)]">
        {tag}
      </div>
      <h4 className="text-[18px] font-semibold tracking-tight text-[var(--aurex-text-1)]">
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
    <section id="import" className="aurex-hairline relative overflow-hidden py-16 sm:py-20 lg:py-24">
      <div
        aria-hidden
        className="aurex-aurora aurex-aurora-indigo -bottom-20 -left-32 h-[420px] w-[520px]"
      />
      <div className={`${SECTION} relative z-10`}>
        <div
          className="aurex-card-marketing aurex-reveal relative overflow-hidden p-8 sm:p-10 lg:p-12"
          data-reveal
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-[360px] w-[360px] rounded-full opacity-50 blur-[100px]"
            style={{
              background:
                'radial-gradient(closest-side, rgba(34,211,238,0.45), transparent)',
            }}
          />
          <div className="relative flex flex-col items-start gap-4">
            <span
              className="inline-grid size-11 place-items-center rounded-[12px] text-white"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
                boxShadow: '0 12px 32px rgba(99,102,241,0.32)',
              }}
            >
              <Upload className="size-5" />
            </span>
            <h3 className="text-[28px] font-semibold tracking-[-0.02em] text-[var(--aurex-text-1)] sm:text-[36px]">
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
                  <s.icon className="size-4 text-[#a5b4fc]" />
                </span>
                <div>
                  <div className="text-[20px] font-semibold tracking-tight text-[var(--aurex-text-1)]">
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
    <section id="privacy" className="aurex-hairline relative overflow-hidden bg-[rgba(255,255,255,0.012)] py-14">
      <div
        aria-hidden
        className="aurex-aurora aurex-aurora-indigo left-1/2 top-1/2 h-[120px] w-[1100px] -translate-x-1/2 -translate-y-1/2 opacity-25"
        style={{ filter: 'blur(80px)' }}
      />
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
                <it.icon className="size-3.5 text-[#a5b4fc]" />
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
    <section className="relative overflow-hidden py-16 sm:py-20 lg:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-[140px]"
        style={{
          background:
            'radial-gradient(closest-side, rgba(99,102,241,0.45), rgba(34,211,238,0.18) 60%, transparent)',
        }}
      />
      <div
        aria-hidden
        className="aurex-aurora aurex-aurora-cyan right-1/3 top-0 h-[260px] w-[420px] opacity-30"
      />
      <div className={`${SECTION} relative z-10 text-center`}>
        <h2
          className="aurex-reveal mx-auto max-w-[640px] text-[36px] font-semibold leading-[1.08] tracking-[-0.02em] text-[var(--aurex-text-1)] sm:text-[48px]"
          data-reveal
        >
          Get a clearer picture of your money — today.
        </h2>
        <p
          className="aurex-reveal mx-auto mt-5 max-w-[520px] text-[16px] leading-[1.65] text-[var(--aurex-text-2)]"
          data-reveal
          style={{ ['--reveal-delay']: '120ms' } as React.CSSProperties}
        >
          Free to try. No credit card. Your data is yours and only yours.
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
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="inline-block transition-shadow duration-300 rounded-[12px] group-hover:shadow-[0_0_24px_rgba(99,102,241,0.5)]">
            <BrandMark size={26} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-[var(--aurex-text-1)] transition-colors duration-200 group-hover:text-white">
            Aurex
          </span>
        </Link>
        <span className="text-[12.5px] text-[var(--aurex-text-3)]">
          © {new Date().getFullYear()} Aurex — Money, in clear view.
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
