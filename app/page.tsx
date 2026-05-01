import Link from 'next/link';
import { Show } from '@clerk/nextjs';
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
  TrendingUp,
  Upload,
  WalletCards,
  Wand2,
  Zap,
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
    <header className="sticky top-0 z-50 border-b border-[var(--aurex-border)] bg-[rgba(5,7,23,0.72)] backdrop-blur-xl">
      <div className={`${SECTION_WIDE} flex h-[68px] items-center justify-between`}>
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark size={30} />
          <span className="text-[17px] font-semibold tracking-tight text-[var(--aurex-text-1)]">
            Aurex
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {[
            { href: '#preview', label: 'Product' },
            { href: '#insights', label: 'Insights' },
            { href: '#import', label: 'Import' },
            { href: '#trust', label: 'Security' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[14px] font-medium text-[var(--aurex-text-2)] transition-colors hover:text-[var(--aurex-text-1)]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Show when="signed-in">
            <Link
              href="/dashboard"
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] px-3.5 text-[14px] font-semibold text-white shadow-[0_8px_24px_rgba(99,102,241,0.35)] transition-transform hover:-translate-y-0.5"
            >
              Open dashboard
              <ArrowRight className="size-3.5" />
            </Link>
          </Show>
          <Show when="signed-out">
            <Link
              href="/sign-in"
              className="hidden h-9 items-center px-3 text-[14px] font-medium text-[var(--aurex-text-2)] transition-colors hover:text-[var(--aurex-text-1)] sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] px-3.5 text-[14px] font-semibold text-white shadow-[0_8px_24px_rgba(99,102,241,0.35)] transition-transform hover:-translate-y-0.5"
            >
              Get started
              <ArrowRight className="size-3.5" />
            </Link>
          </Show>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-[var(--aurex-border)]">
      <div className="aurex-mesh" aria-hidden />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-32 -z-0 h-[520px] w-[820px] -translate-x-1/2 rounded-full opacity-60 blur-[160px]"
        style={{
          background:
            'radial-gradient(closest-side, rgba(139,92,246,0.45), rgba(34,211,238,0.18) 60%, transparent 80%)',
        }}
      />

      <div className={`${SECTION_WIDE} relative z-10 grid gap-14 pt-20 pb-24 lg:grid-cols-[1.05fr_1.4fr] lg:gap-12 lg:pt-24 lg:pb-28`}>
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

          <dl className="mt-12 grid w-full max-w-[460px] grid-cols-3 gap-6 border-t border-[var(--aurex-border)] pt-7">
            {[
              { value: '6 charts', label: 'Visualizations' },
              { value: 'CSV', label: 'Import in seconds' },
              { value: 'E2E', label: 'Encrypted by Clerk' },
            ].map((s) => (
              <div key={s.label}>
                <dt className="text-[20px] font-semibold tracking-tight text-[var(--aurex-text-1)]">
                  {s.value}
                </dt>
                <dd className="mt-1 text-[12px] uppercase tracking-[0.1em] text-[var(--aurex-text-3)]">
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
    <div className="aurex-card aurex-card-hover relative overflow-hidden p-4 sm:p-5">
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
        <div className="aurex-card relative overflow-hidden p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] font-semibold text-[var(--aurex-text-1)]">
                Cash flow
              </div>
              <div className="text-[11px] text-[var(--aurex-text-3)]">
                Income vs. expenses · daily
              </div>
            </div>
            <div className="flex items-center gap-1">
              {['Area', 'Line', 'Bar'].map((r, i) => (
                <span
                  key={r}
                  className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                    i === 0
                      ? 'bg-[var(--aurex-surface-hover)] text-[var(--aurex-text-1)] ring-1 ring-[var(--aurex-border-strong)]'
                      : 'text-[var(--aurex-text-3)]'
                  }`}
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
          <FlowChart />
          <div className="mt-2 flex items-center gap-4 text-[11px] text-[var(--aurex-text-2)]">
            <LegendDot color="#34d399" /> Income
            <LegendDot color="#fb7185" /> Expenses
          </div>
        </div>

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
      className={`aurex-card aurex-card-hover relative overflow-hidden p-4 ring-1 ${toneMap.ring}`}
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

function FlowChart() {
  return (
    <svg viewBox="0 0 600 180" className="mt-3 h-[170px] w-full">
      <defs>
        <linearGradient id="incomeGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="expenseGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#fb7185" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#fb7185" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[...Array(4)].map((_, i) => (
        <line
          key={i}
          x1="0"
          x2="600"
          y1={36 * (i + 1)}
          y2={36 * (i + 1)}
          stroke="rgba(148,163,255,0.08)"
        />
      ))}
      {/* Expenses (back layer) */}
      <path
        d="M0,140 C60,130 100,110 160,118 C220,126 260,100 320,108 C380,116 420,130 480,118 C540,108 580,120 600,114 L600,180 L0,180 Z"
        fill="url(#expenseGrad)"
      />
      <path
        d="M0,140 C60,130 100,110 160,118 C220,126 260,100 320,108 C380,116 420,130 480,118 C540,108 580,120 600,114"
        fill="none"
        stroke="#fb7185"
        strokeWidth="2"
      />
      {/* Income (front layer) */}
      <path
        d="M0,110 C60,90 100,40 160,52 C220,64 260,28 320,40 C380,52 420,80 480,58 C540,40 580,30 600,18 L600,180 L0,180 Z"
        fill="url(#incomeGrad)"
      />
      <path
        d="M0,110 C60,90 100,40 160,52 C220,64 260,28 320,40 C380,52 420,80 480,58 C540,40 580,30 600,18"
        fill="none"
        stroke="#34d399"
        strokeWidth="2.2"
      />
      <circle cx="600" cy="18" r="4" fill="#34d399">
        <animate
          attributeName="r"
          values="4;6;4"
          dur="2.4s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}

function LegendDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block size-2 rounded-full"
      style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
    />
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
    <div className="aurex-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[13px] font-semibold text-[var(--aurex-text-1)]">
          Recent transactions
        </div>
        <span className="text-[11px] text-[var(--aurex-text-3)]">5 latest</span>
      </div>
      <ul className="space-y-2.5">
        {items.map((t) => (
          <li
            key={t.payee}
            className="flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--aurex-surface)]"
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
    <div className="aurex-card p-4">
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

function FeatureRow() {
  const features = [
    {
      icon: WalletCards,
      title: 'Every account, one view',
      desc: 'Checking, savings, credit cards. Each transaction belongs to an account, so totals stay separate where they need to and combine where they should.',
    },
    {
      icon: TrendingUp,
      title: 'Charts that read like a story',
      desc: 'Area, line, bar. Pie, radar, radial. Switch the chart without losing the filter — the data updates together, not piecemeal.',
    },
    {
      icon: Wand2,
      title: 'Categorize as you go',
      desc: 'Rename, split, and refine categories whenever your habits change. Spending breakdowns stay accurate over time.',
    },
  ];

  return (
    <section id="preview" className="relative border-b border-[var(--aurex-border)] py-24">
      <div className={SECTION}>
        <div className="mb-14 max-w-[640px]">
          <SectionEyebrow icon={LineChart} label="Built for clarity" />
          <h2 className="text-[34px] font-semibold leading-[1.1] tracking-[-0.02em] text-[var(--aurex-text-1)] sm:text-[44px]">
            A workspace that{' '}
            <span className="bg-gradient-to-br from-[#a5b4fc] to-[#22d3ee] bg-clip-text text-transparent">
              respects your time.
            </span>
          </h2>
          <p className="mt-5 max-w-[520px] text-[16px] leading-[1.65] text-[var(--aurex-text-2)]">
            Three things matter when you&rsquo;re looking at your money: the
            number, the trend, and the why. Aurex keeps all three on screen.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="aurex-card aurex-card-hover p-6">
              <div
                className="mb-5 inline-grid size-11 place-items-center rounded-[12px] text-white"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(34,211,238,0.25))',
                  boxShadow: 'inset 0 0 0 1px rgba(99,102,241,0.4), 0 8px 24px rgba(99,102,241,0.18)',
                }}
              >
                <f.icon className="size-5" />
              </div>
              <h3 className="text-[17px] font-semibold tracking-tight text-[var(--aurex-text-1)]">
                {f.title}
              </h3>
              <p className="mt-2.5 text-[14.5px] leading-[1.6] text-[var(--aurex-text-2)]">
                {f.desc}
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
    <section id="insights" className="relative border-b border-[var(--aurex-border)] py-24">
      <div className={SECTION}>
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

      <div className={`${SECTION_WIDE} mt-12`}>
        <div className="aurex-card relative overflow-hidden p-6 sm:p-7">
          <div className="flex items-center justify-between border-b border-[var(--aurex-border)] pb-4">
            <div className="flex items-center gap-2.5">
              <TrendingUp className="size-4 text-[#a5b4fc]" />
              <span className="text-[14px] font-semibold text-[var(--aurex-text-1)]">
                Cash flow · Last 90 days
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {['Area', 'Line', 'Bar'].map((r, i) => (
                <span
                  key={r}
                  className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                    i === 0
                      ? 'bg-[var(--aurex-surface-hover)] text-[var(--aurex-text-1)] ring-1 ring-[var(--aurex-border-strong)]'
                      : 'text-[var(--aurex-text-3)] hover:text-[var(--aurex-text-1)]'
                  }`}
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
          <div className="pt-6">
            <svg viewBox="0 0 1200 280" className="h-[260px] w-full">
              <defs>
                <linearGradient id="bigIncome" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="bigExpense" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#fb7185" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#fb7185" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[...Array(6)].map((_, i) => (
                <line
                  key={i}
                  x1="0"
                  x2="1200"
                  y1={40 * (i + 1)}
                  y2={40 * (i + 1)}
                  stroke="rgba(148,163,255,0.08)"
                />
              ))}
              <path
                d="M0,210 C100,200 180,180 260,186 C340,194 420,160 500,170 C580,180 660,200 740,180 C820,160 900,170 980,160 C1060,150 1140,170 1200,158 L1200,280 L0,280 Z"
                fill="url(#bigExpense)"
              />
              <path
                d="M0,210 C100,200 180,180 260,186 C340,194 420,160 500,170 C580,180 660,200 740,180 C820,160 900,170 980,160 C1060,150 1140,170 1200,158"
                fill="none"
                stroke="#fb7185"
                strokeWidth="2"
              />
              <path
                d="M0,180 C100,160 180,90 260,108 C340,128 420,60 500,80 C580,100 660,150 740,118 C820,90 900,40 980,68 C1060,98 1140,50 1200,30 L1200,280 L0,280 Z"
                fill="url(#bigIncome)"
              />
              <path
                d="M0,180 C100,160 180,90 260,108 C340,128 420,60 500,80 C580,100 660,150 740,118 C820,90 900,40 980,68 C1060,98 1140,50 1200,30"
                fill="none"
                stroke="#34d399"
                strokeWidth="2.5"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className={`${SECTION} mt-14 grid gap-10 md:grid-cols-2`}>
        <SmallFeature
          icon={PieChart}
          tag="Spending breakdown"
          title="See where the money went"
          desc="A pie of expenses by category — plus radar and radial alternatives so the chart matches the question you're asking."
        />
        <SmallFeature
          icon={ShieldCheck}
          tag="Filter & focus"
          title="Account and date filters"
          desc="Narrow the dashboard to a single account or a custom date range. The charts and totals update together — no stale numbers."
        />
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
    <div className="aurex-card aurex-card-hover p-6">
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
    <section id="import" className="relative border-b border-[var(--aurex-border)] py-24">
      <div className={SECTION}>
        <div className="aurex-card aurex-card-hover relative overflow-hidden p-10 sm:p-14">
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
          <div className="relative mt-12 grid gap-8 border-t border-[var(--aurex-border)] pt-10 md:grid-cols-3">
            {[
              { stat: 'Drop', label: 'A CSV from any bank', icon: Upload },
              { stat: 'Map', label: 'Pick which columns mean what', icon: Wand2 },
              { stat: 'Review', label: 'Confirm rows before saving', icon: ShieldCheck },
            ].map((s) => (
              <div key={s.label} className="flex items-start gap-3">
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
    { icon: Lock, label: 'Auth by Clerk' },
    { icon: ShieldCheck, label: 'Multi-tenant by design' },
    { icon: Zap, label: 'Built on Next.js 15' },
    { icon: TrendingUp, label: 'Recharts + Tailwind v4' },
  ];
  return (
    <section id="trust" className="border-b border-[var(--aurex-border)] py-14">
      <div className={`${SECTION} flex flex-wrap items-center justify-between gap-6`}>
        <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--aurex-text-3)]">
          Built on a stack you trust
        </span>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          {items.map((it) => (
            <span
              key={it.label}
              className="inline-flex items-center gap-2 text-[13.5px] text-[var(--aurex-text-2)]"
            >
              <it.icon className="size-4 text-[#a5b4fc]" />
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
    <section className="relative overflow-hidden py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-[140px]"
        style={{
          background:
            'radial-gradient(closest-side, rgba(99,102,241,0.45), rgba(34,211,238,0.18) 60%, transparent)',
        }}
      />
      <div className={`${SECTION} relative text-center`}>
        <h2 className="mx-auto max-w-[640px] text-[36px] font-semibold leading-[1.08] tracking-[-0.02em] text-[var(--aurex-text-1)] sm:text-[48px]">
          Get a clearer picture of your money — today.
        </h2>
        <p className="mx-auto mt-5 max-w-[520px] text-[16px] leading-[1.65] text-[var(--aurex-text-2)]">
          Free to try. No credit card. Your data is yours and only yours.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
        <div className="flex items-center gap-2.5">
          <BrandMark size={26} />
          <span className="text-[15px] font-semibold tracking-tight text-[var(--aurex-text-1)]">
            Aurex
          </span>
        </div>
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
      <NavBar />
      <Hero />
      <FeatureRow />
      <InsightsSection />
      <ImportSection />
      <TrustBand />
      <CtaBand />
      <Footer />
    </main>
  );
}
