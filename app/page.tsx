import Link from 'next/link';
import { ClerkLoaded, ClerkLoading, Show, UserButton } from '@clerk/nextjs';
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronDown,
  Loader2,
  Lock,
  ShieldCheck,
  Upload,
  WalletCards,
} from 'lucide-react';
import { LogoMark } from '@/components/brand/logo';
import { ScrollReveal } from '@/components/marketing/scroll-reveal';
import { ScrollSpyNav } from '@/components/marketing/scroll-spy-nav';
import { formatCurrency } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const SECTION = 'mx-auto w-full max-w-[1120px] px-6 sm:px-8 lg:px-14';
const SECTION_WIDE = 'mx-auto w-full max-w-[1360px] px-6 sm:px-8 lg:px-14';

/* ------------------------------------------------------------------ */
/* Sample data — one dataset feeds the hero statement, the import     */
/* strip, and the closing motif. Totals are derived, never typed, so  */
/* every figure on the page reconciles by construction.               */
/* ------------------------------------------------------------------ */

const STATEMENT_PERIOD = 'May 1–31, 2026';

type SampleRow = {
  day: string;
  payee: string;
  category: string;
  csv: string;
  cents: number;
};

const SAMPLE_ROWS: SampleRow[] = [
  {
    day: '02',
    payee: 'Hartfield Apartments',
    category: 'Rent',
    csv: 'HARTFIELD APTS',
    cents: -195000,
  },
  {
    day: '05',
    payee: 'Brightline Studio payroll',
    category: 'Income',
    csv: 'BRIGHTLINE PAYROLL',
    cents: 312045,
  },
  {
    day: '09',
    payee: 'Maple & Vine Grocers',
    category: 'Groceries',
    csv: 'MAPLE VINE GROCERS',
    cents: -13218,
  },
  {
    day: '14',
    payee: 'City Transit',
    category: 'Transport',
    csv: 'CITY TRANSIT',
    cents: -5850,
  },
  {
    day: '19',
    payee: 'Stillwater Design invoice',
    category: 'Income',
    csv: 'STILLWATER DESIGN',
    cents: 115000,
  },
  {
    day: '24',
    payee: 'Juniper Café',
    category: 'Dining',
    csv: 'JUNIPER CAFE',
    cents: -4762,
  },
];

const IN_CENTS = SAMPLE_ROWS.filter((r) => r.cents > 0).reduce((s, r) => s + r.cents, 0);
const OUT_CENTS = SAMPLE_ROWS.filter((r) => r.cents < 0).reduce((s, r) => s - r.cents, 0);
const NET_CENTS = IN_CENTS - OUT_CENTS;
const HERO_ROWS = [SAMPLE_ROWS[1], SAMPLE_ROWS[0], SAMPLE_ROWS[4], SAMPLE_ROWS[2]];

const SAMPLE_ACCOUNTS = [
  { name: 'Checking', cents: 320418 },
  { name: 'Savings', cents: 1289000 },
  { name: 'Credit card', cents: -64210 },
];
const ACCOUNTS_TOTAL_CENTS = SAMPLE_ACCOUNTS.reduce((s, a) => s + a.cents, 0);

const usd = (cents: number) => formatCurrency(cents / 100);
/* U+2212 minus, not a hyphen: consistent width in the mono column and
   screen readers voice it. Money color is always paired with this sign. */
const signedUsd = (cents: number) =>
  `${cents < 0 ? '−' : '+'}${formatCurrency(Math.abs(cents) / 100)}`;
const moneyClass = (cents: number) =>
  cents < 0 ? 'text-[var(--aurex-expense)]' : 'text-[var(--aurex-income)]';
/* Raw two-decimal amount as a bank CSV writes it: hyphen-minus, no sign pairing.
   The reconciliation display (signedUsd) is the product's voice; this is the bank's. */
const csvAmount = (cents: number) => (cents / 100).toFixed(2);

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

function HeroStatement() {
  return (
    <section
      data-testid="landing-hero"
      className="aurex-hairline relative overflow-hidden"
    >
      <div className="aurex-ruling" aria-hidden />

      <div
        className={`${SECTION_WIDE} relative z-10 grid min-h-[calc(100svh-108px)] items-center gap-12 py-10 sm:py-14 md:min-h-[calc(100svh-68px)] lg:grid-cols-[minmax(0,0.94fr)_minmax(560px,1.06fr)] lg:gap-14 lg:py-16 xl:gap-16`}
      >
        <div className="aurex-rise max-w-[620px] lg:py-8">
          <div className="flex items-center gap-3 text-[14px] font-semibold text-[var(--aurex-text-2)]">
            <span className="h-px w-10 bg-[var(--aurex-text-1)]" aria-hidden />
            Personal finance, reconciled
          </div>

          <h1 className="mt-7 max-w-[680px] font-display text-[48px] font-semibold leading-[0.98] tracking-[-0.035em] text-[var(--aurex-text-1)] sm:text-[64px] lg:text-[76px] xl:text-[80px]">
            <span className="block">Every dollar,</span>
            <span className="block">accounted for.</span>
          </h1>

          <p className="mt-7 max-w-[580px] text-[18px] leading-[1.58] text-[var(--aurex-text-2)] sm:text-[20px]">
            Aurex pulls every account, category, and transaction into one
            readable statement, then reconciles what came in against what went
            out, to the cent.
          </p>

          <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <Show when="signed-in">
              <Link
                data-testid="hero-primary-cta"
                href="/dashboard"
                className="aurex-button-primary aurex-button-hero"
              >
                Open dashboard
                <ArrowRight className="size-4" />
              </Link>
            </Show>
            <Show when="signed-out">
              <Link
                data-testid="hero-primary-cta"
                href="/sign-up"
                className="aurex-button-primary aurex-button-hero"
              >
                Start tracking, free
                <ArrowRight className="size-4" />
              </Link>
            </Show>
            <a href="#how-it-works" className="aurex-button-ghost aurex-button-hero">
              See how it works
              <ArrowDown className="size-4" />
            </a>
          </div>

          <p className="mt-5 text-[14px] leading-relaxed text-[var(--aurex-text-3)] sm:text-[15px]">
            Import a bank CSV in minutes — Aurex parses it right in your browser.
          </p>
        </div>

        <SampleStatement />
      </div>
    </section>
  );
}

function SampleStatement() {
  return (
    <section
      aria-label={`Sample statement, ${STATEMENT_PERIOD}`}
      className="aurex-statement aurex-rise relative min-w-0 overflow-hidden"
    >
      <div className="aurex-ledger-spine" aria-hidden>
        <span>AUREX</span>
        <span>05 / 2026</span>
        <span>PAGE 01</span>
      </div>

      <div className="min-w-0 px-5 py-5 sm:px-7 sm:py-6 lg:px-8">
        <header className="flex items-start justify-between gap-5 border-b border-[var(--aurex-border-strong)] pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <BrandMark size={28} />
            <div className="min-w-0">
              <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-[var(--aurex-text-1)]">
                Aurex statement
              </h2>
              <p className="mt-0.5 text-[12px] tabular-nums text-[var(--aurex-text-3)] sm:text-[13px]">
                {STATEMENT_PERIOD} · Sample figures
              </p>
            </div>
          </div>
          <span className="hidden shrink-0 font-mono text-[12px] font-medium tabular-nums text-[var(--aurex-text-3)] sm:inline">
            AX-0526-01
          </span>
        </header>

        <div className="grid gap-5 border-b border-[var(--aurex-border-strong)] py-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div>
            <p className="text-[14px] font-medium text-[var(--aurex-text-2)]">
              Net this period
            </p>
            <p className="mt-2 font-display text-[48px] font-semibold leading-none tracking-[-0.025em] text-[var(--aurex-text-1)] tabular-nums sm:text-[58px] lg:text-[64px]">
              {usd(NET_CENTS)}
            </p>
          </div>
          <div className="aurex-reconciled-mark" aria-label="Reconciled to the cent">
            <Check className="size-5 stroke-[2.5]" aria-hidden />
            <span>
              Reconciled
              <small>to the cent</small>
            </span>
          </div>
        </div>

        <div className="py-5">
          <p className="text-[12px] font-semibold text-[var(--aurex-text-3)]">
            In − Out = Net
          </p>
          <div
            aria-label={`Reconciliation equation: In ${usd(IN_CENTS)} minus Out ${usd(OUT_CENTS)} equals Net ${usd(NET_CENTS)}`}
            className="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2.5 font-mono text-[14px] font-semibold tabular-nums sm:grid-cols-[auto_1fr_auto_1fr_auto_1fr] sm:items-baseline sm:gap-x-3 sm:text-[15px]"
          >
            <span className="text-[var(--aurex-text-3)]">In</span>
            <span className="text-right text-[var(--aurex-income)]">
              {signedUsd(IN_CENTS)}
            </span>
            <span className="hidden text-[var(--aurex-text-3)] sm:inline">−</span>
            <span className="text-[var(--aurex-text-3)] sm:hidden">Out</span>
            <span className="text-right text-[var(--aurex-expense)]">
              {signedUsd(-OUT_CENTS)}
            </span>
            <span className="hidden text-[var(--aurex-text-3)] sm:inline">=</span>
            <span className="text-[var(--aurex-text-3)] sm:hidden">Net</span>
            <span className="text-right text-[var(--aurex-text-1)]">
              {usd(NET_CENTS)}
            </span>
          </div>
        </div>

        <div className="border-t border-[var(--aurex-border-strong)] pt-4">
          <div className="flex items-baseline justify-between gap-4 pb-2">
            <h3 className="text-[15px] font-semibold text-[var(--aurex-text-1)]">
              Posted activity
            </h3>
            <span className="text-[12px] text-[var(--aurex-text-3)]">
              4 of {SAMPLE_ROWS.length} rows
            </span>
          </div>

          <ul>
            {HERO_ROWS.map((row) => (
              <li
                key={row.day}
                className="grid grid-cols-[minmax(0,1fr)_max-content] items-baseline gap-x-4 border-b border-[var(--aurex-border)] py-3.5"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-medium text-[var(--aurex-text-1)] sm:text-[16px]">
                    {row.payee}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-[var(--aurex-text-3)] sm:text-[13.5px]">
                    May {row.day} · {row.category}
                  </span>
                </span>
                <span
                  className={`text-right font-mono text-[14px] font-semibold tabular-nums sm:text-[15px] ${moneyClass(row.cents)}`}
                >
                  {signedUsd(row.cents)}
                </span>
              </li>
            ))}
          </ul>

          <div className="aurex-rule-total flex items-baseline justify-between gap-4 py-3">
            <span className="text-[13px] font-medium text-[var(--aurex-text-2)]">
              Period net · all six rows
            </span>
            <span className="font-mono text-[15px] font-semibold tabular-nums text-[var(--aurex-text-1)]">
              {usd(NET_CENTS)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* One artifact tells the product story: the same six rows, three states. */
function TransformationStrip() {
  return (
    <section
      id="how-it-works"
      className="aurex-hairline relative py-18 sm:py-22 lg:py-28"
    >
      <div className={SECTION}>
        <div className="aurex-reveal max-w-[720px]" data-reveal>
          <h2 className="font-display text-[38px] font-semibold leading-[1.06] tracking-[-0.02em] text-[var(--aurex-text-1)] [text-wrap:balance] sm:text-[50px]">
            Bring it in. Sort it. Read it.
          </h2>
          <p className="mt-6 max-w-[640px] text-[17px] leading-[1.65] text-[var(--aurex-text-2)] sm:text-[18px]">
            Drop a CSV from your bank: Aurex parses it in your browser, you map
            the columns to date, amount, and payee, and the rows become a
            statement. Below, the six transactions from above make the trip.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 divide-y divide-[var(--aurex-border)] border-y border-[var(--aurex-border-strong)] lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          <StripStage
            title="The import"
            desc="Match each bank column to a field — date, amount, payee. The raw export becomes rows Aurex understands."
            delay={0}
          >
            <ImportMapping />
          </StripStage>

          <StripStage
            title="The ledger"
            desc="Every row gets a payee and a category. Rename a category later and old rows follow."
            delay={100}
          >
            <ul>
              {SAMPLE_ROWS.map((row, i) => (
                <li
                  key={row.day}
                  className={`flex items-baseline justify-between gap-4 border-b border-[var(--aurex-border)] py-2.5 last:border-b-0 ${
                    i >= 3 ? 'hidden lg:flex' : ''
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] text-[var(--aurex-text-1)]">
                      {row.payee}
                    </span>
                    <span className="block text-[13px] text-[var(--aurex-text-3)]">
                      {row.category}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 font-mono text-[14px] font-semibold tabular-nums ${moneyClass(row.cents)}`}
                  >
                    {signedUsd(row.cents)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="pt-2.5 text-[12.5px] text-[var(--aurex-text-3)] lg:hidden">
              Showing first 3 of {SAMPLE_ROWS.length} rows
            </p>
          </StripStage>

          <StripStage
            title="The statement"
            desc="Aurex does the arithmetic. In, minus out, equals net: the number you came for."
            delay={200}
          >
            <dl>
              <div className="flex items-baseline justify-between gap-3 border-b border-[var(--aurex-border)] py-2.5">
                <dt className="text-[15px] text-[var(--aurex-text-2)]">In</dt>
                <dd className="font-mono text-[15px] font-semibold tabular-nums text-[var(--aurex-income)]">
                  {signedUsd(IN_CENTS)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-b border-[var(--aurex-border)] py-2.5">
                <dt className="text-[15px] text-[var(--aurex-text-2)]">Out</dt>
                <dd className="font-mono text-[15px] font-semibold tabular-nums text-[var(--aurex-expense)]">
                  {signedUsd(-OUT_CENTS)}
                </dd>
              </div>
              <div className="aurex-rule-total flex items-baseline justify-between gap-3 py-2.5">
                <dt className="text-[15px] font-medium text-[var(--aurex-text-1)]">Net</dt>
                <dd className="font-mono text-[15px] font-semibold tabular-nums text-[var(--aurex-text-1)]">
                  {usd(NET_CENTS)}
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-[13.5px] text-[var(--aurex-text-3)]">
              The same six rows, reconciled.
            </p>
          </StripStage>
        </div>
      </div>
    </section>
  );
}

/* A faithful, static echo of the real import mapper
   (app/(dashboard)/transactions/import-table.tsx): the bank's own column header
   sits above the Aurex field it's been mapped to. Mobile shows three rows; the
   full six appear at lg, mirroring the live "Showing first N of M" preview. */
const MAP_COLUMNS = [
  { source: 'Date', field: 'Date', value: (r: SampleRow) => `2026-05-${r.day}` },
  { source: 'Amount', field: 'Amount', value: (r: SampleRow) => csvAmount(r.cents) },
  { source: 'Description', field: 'Payee', value: (r: SampleRow) => r.csv },
];

function ImportMapping() {
  return (
    <div className="overflow-hidden rounded-md border border-[var(--aurex-border)]">
      <table className="w-full table-fixed border-collapse text-left">
        <colgroup>
          <col className="w-[32%]" />
          <col className="w-[32%]" />
          <col />
        </colgroup>
        <thead>
          <tr className="border-b border-[var(--aurex-border)] bg-[var(--aurex-surface)]">
            {MAP_COLUMNS.map((col) => (
              <th key={col.source} className="px-2 pb-2.5 pt-2 align-bottom font-normal">
                <span className="block truncate text-[10.5px] uppercase tracking-[0.08em] text-[var(--aurex-text-3)]">
                  {col.source}
                </span>
                <span className="mt-1.5 inline-flex h-7 max-w-full items-center gap-0.5 rounded-md border border-[rgba(22,24,29,0.32)] bg-[rgba(22,24,29,0.1)] px-1.5 text-[12px] font-medium text-[var(--aurex-brand-text)]">
                  <span className="truncate">{col.field}</span>
                  <ChevronDown className="size-2.5 shrink-0 opacity-70" aria-hidden />
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SAMPLE_ROWS.map((row, i) => (
            <tr
              key={row.day}
              className={`border-b border-[var(--aurex-border)] last:border-b-0 ${
                i >= 3 ? 'hidden lg:table-row' : ''
              }`}
            >
              {MAP_COLUMNS.map((col) => (
                <td
                  key={col.source}
                  className="truncate px-2 py-2 font-mono text-[12px] tabular-nums text-[var(--aurex-text-1)]"
                >
                  {col.value(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-[var(--aurex-border)] bg-[var(--aurex-surface)] px-2.5 py-1.5 text-[11px] text-[var(--aurex-text-3)] lg:hidden">
        Showing first 3 of {SAMPLE_ROWS.length} rows
      </div>
    </div>
  );
}

function StripStage({
  title,
  desc,
  delay,
  children,
}: {
  title: string;
  desc: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="aurex-reveal py-9 lg:px-9 lg:py-10 lg:first:pl-0 lg:last:pr-0"
      data-reveal
      style={{ ['--reveal-delay']: `${delay}ms` } as React.CSSProperties}
    >
      <h3 className="text-[20px] font-semibold tracking-[-0.01em] text-[var(--aurex-text-1)]">
        {title}
      </h3>
      <p className="mt-2 max-w-[420px] text-[16px] leading-[1.6] text-[var(--aurex-text-2)]">
        {desc}
      </p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function AccountsBlock() {
  return (
    <section id="accounts" className="aurex-hairline relative py-18 sm:py-22 lg:py-24">
      <div
        className={`${SECTION} grid items-start gap-12 md:grid-cols-[minmax(300px,380px)_1fr] lg:gap-20`}
      >
        <div className="aurex-reveal" data-reveal>
          <p className="border-b border-[var(--aurex-border-strong)] pb-3 text-[15px] font-semibold text-[var(--aurex-text-2)]">
            Account position
          </p>
          <ul>
            {SAMPLE_ACCOUNTS.map((account) => (
              <li
                key={account.name}
                className="flex items-baseline justify-between gap-4 border-b border-[var(--aurex-border)] py-3.5"
              >
                <span className="text-[16px] text-[var(--aurex-text-1)]">
                  {account.name}
                </span>
                <span
                  className={`font-mono text-[15px] font-semibold tabular-nums ${
                    account.cents < 0
                      ? 'text-[var(--aurex-expense)]'
                      : 'text-[var(--aurex-text-1)]'
                  }`}
                >
                  {account.cents < 0 ? signedUsd(account.cents) : usd(account.cents)}
                </span>
              </li>
            ))}
          </ul>
          <div className="aurex-rule-total flex items-baseline justify-between gap-4 py-3.5">
            <span className="text-[14px] font-medium text-[var(--aurex-text-2)]">
              Across accounts
            </span>
            <span className="font-mono text-[15px] font-semibold tabular-nums text-[var(--aurex-text-1)]">
              {usd(ACCOUNTS_TOTAL_CENTS)}
            </span>
          </div>
        </div>

        <div
          className="aurex-reveal"
          data-reveal
          style={{ ['--reveal-delay']: '120ms' } as React.CSSProperties}
        >
          <h2 className="font-display text-[36px] font-semibold leading-[1.08] tracking-[-0.02em] text-[var(--aurex-text-1)] [text-wrap:balance] sm:text-[44px]">
            Every account, one sheet.
          </h2>
          <p className="mt-5 max-w-[560px] text-[17px] leading-[1.65] text-[var(--aurex-text-2)]">
            Checking, savings, and credit cards sit in one ledger. Filter the
            statement to a single account or a custom date range, and every
            total on the page recalculates with it.
          </p>
          <p className="mt-4 max-w-[560px] text-[17px] leading-[1.65] text-[var(--aurex-text-2)]">
            Close an account and its history stays put: old transactions keep
            their rows, and your totals keep their truth.
          </p>
        </div>
      </div>
    </section>
  );
}

function TrustLine() {
  const items = [
    { icon: Upload, label: 'CSV parsed in your browser' },
    { icon: ShieldCheck, label: 'Your data, scoped to your account' },
    { icon: Lock, label: 'Sign-in handled by Clerk' },
    { icon: WalletCards, label: 'Optional Plaid bank sync' },
  ];
  return (
    <section id="privacy" className="aurex-hairline relative py-14">
      <div className={SECTION}>
        <h2 className="sr-only">Privacy</h2>
        <div
          className="aurex-reveal flex flex-wrap items-center gap-x-10 gap-y-4"
          data-reveal
        >
          {items.map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-2.5 text-[15px] text-[var(--aurex-text-2)]"
            >
              <item.icon
                aria-hidden
                className="size-4 shrink-0 text-[var(--aurex-text-3)]"
              />
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClosingStatement() {
  return (
    <section className="relative py-18 sm:py-24 lg:py-28">
      <div className={SECTION}>
        <div className="aurex-closing-rule grid gap-9 py-9 sm:py-11 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-end lg:gap-16">
          <div className="aurex-reveal" data-reveal>
            <p className="font-mono text-[13px] tabular-nums text-[var(--aurex-text-3)]">
              Balance carried forward · {usd(NET_CENTS)} · sample
            </p>
            <h2 className="mt-5 max-w-[700px] font-display text-[42px] font-semibold leading-[1.04] tracking-[-0.025em] text-[var(--aurex-text-1)] [text-wrap:balance] sm:text-[58px]">
              Your money, finally legible.
            </h2>
          </div>

          <div
            className="aurex-reveal"
            data-reveal
            style={{ ['--reveal-delay']: '140ms' } as React.CSSProperties}
          >
            <p className="max-w-[480px] text-[17px] leading-[1.65] text-[var(--aurex-text-2)]">
              Import a CSV and read your first reconciled statement in a couple
              of minutes. Free to start.
            </p>
            <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <Show when="signed-in">
                <Link href="/dashboard" className="aurex-button-primary aurex-button-hero">
                  Open dashboard
                  <ArrowRight className="size-4" />
                </Link>
              </Show>
              <Show when="signed-out">
                <Link href="/sign-up" className="aurex-button-primary aurex-button-hero">
                  Create your workspace
                  <ArrowRight className="size-4" />
                </Link>
                <Link href="/sign-in" className="aurex-button-ghost aurex-button-hero">
                  Sign in
                </Link>
              </Show>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const legal = [
    { href: '/privacy', label: 'Privacy' },
    { href: '/terms', label: 'Terms' },
    { href: '/support', label: 'Support' },
  ];
  return (
    <footer className="border-t border-[var(--aurex-border)] py-10">
      <div
        className={`${SECTION} flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between`}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark size={26} />
          <span className="text-[15px] font-semibold tracking-tight text-[var(--aurex-text-1)]">
            Aurex
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {legal.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[13.5px] text-[var(--aurex-text-2)] transition-colors hover:text-[var(--aurex-text-1)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
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
      <HeroStatement />
      <TransformationStrip />
      <AccountsBlock />
      <TrustLine />
      <ClosingStatement />
      <Footer />
    </main>
  );
}
