'use client';

import Link from 'next/link';
import qs from 'query-string';
import { useSearchParams } from 'next/navigation';
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';

import { cn, formatCurrency, formatPercentage } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { DataError } from '@/components/data-error';
import { useGetSummary } from '@/features/summary/api/use-get-summary';

const SECTION = 'border-b border-[var(--aurex-rule)] p-5 sm:p-6';

// The dashboard's lead: the period's cash position stated as a financial fact, not
// a row of KPI cards. The net figure is set in the grotesque (Schibsted) at display
// size with proportional figures, which keeps commas and the decimal tight where
// monospace opened ugly gaps. The supporting In − Out = Net equation stays in Geist
// Mono with tabular figures so the columns align, making the arithmetic visible.
export function CashPosition() {
  const { data, isLoading, isError, isFetching, refetch } = useGetSummary();
  const params = useSearchParams();

  const transactionsHref = qs.stringifyUrl(
    {
      url: '/transactions',
      query: {
        from: params.get('from') || undefined,
        to: params.get('to') || undefined,
        accountId: params.get('accountId') || undefined,
      },
    },
    { skipNull: true, skipEmptyString: true },
  );

  if (isLoading) return <CashPositionLoading />;

  // Mirror the old DataGrid rule: on a first-load failure with no cached data,
  // surface a retryable error rather than fabricating a $0.00 position.
  if (isError && !data) {
    return (
      <div className={SECTION}>
        <DataError
          className="border-0"
          title="Couldn't load your position"
          message="We couldn't reach your totals. Check your connection and try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const income = data?.incomeAmount ?? 0;
  const expenses = data?.expensesAmount ?? 0;
  const net = data?.remainingAmount ?? 0;
  const change = data?.remainingChange ?? 0;

  // Net up is good (green), net down is bad (rose). Color is paired with a
  // directional arrow and the signed percentage, never carried by hue alone.
  const up = change > 0;
  const flat = change === 0;
  const TrendIcon = up ? ArrowUpRight : ArrowDownRight;

  return (
    <div
      className={cn(SECTION, isFetching && 'opacity-60 transition-opacity duration-300')}
      aria-busy={isFetching}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <span className="text-[13px] font-medium text-[var(--aurex-text-3)]">Net this period</span>
        <Link
          href={transactionsHref}
          className="inline-flex items-center gap-1 text-[12.5px] font-medium text-[#16181d] hover:text-[#3a414b]"
        >
          View transactions <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="font-display text-[40px] font-semibold leading-none tracking-[-0.02em] text-[var(--aurex-text-1)] sm:text-[52px]">
          {formatCurrency(net)}
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-1 text-[13px] font-medium tabular-nums',
            flat
              ? 'text-[var(--aurex-text-3)]'
              : up
                ? 'text-[var(--aurex-income)]'
                : 'text-[var(--aurex-expense)]',
          )}
        >
          {!flat ? <TrendIcon className="size-4" /> : null}
          {formatPercentage(change, { addPrefix: true })} vs last period
        </span>
      </div>

      {/* The equation: In − Out = Net, the arithmetic made visible. */}
      <div className="mt-4 flex flex-wrap items-baseline gap-x-2.5 gap-y-1 font-mono text-[14px] tabular-nums sm:text-[15px]">
        <Term label="In" value={income} valueClass="text-[var(--aurex-income)]" />
        <Operator>−</Operator>
        <Term label="Out" value={expenses} valueClass="text-[var(--aurex-expense)]" />
        <Operator>=</Operator>
        <Term label="Net" value={net} valueClass="text-[var(--aurex-text-1)]" emphasize />
      </div>
    </div>
  );
}

function Term({
  label,
  value,
  valueClass,
  emphasize,
}: {
  label: string;
  value: number;
  valueClass: string;
  emphasize?: boolean;
}) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="font-sans text-[12px] text-[var(--aurex-text-3)]">{label}</span>
      <span className={cn(emphasize ? 'font-semibold' : 'font-medium', valueClass)}>
        {formatCurrency(value)}
      </span>
    </span>
  );
}

function Operator({ children }: { children: React.ReactNode }) {
  return <span className="text-[var(--aurex-text-3)]">{children}</span>;
}

export function CashPositionLoading() {
  return (
    <div className={SECTION}>
      <Skeleton className="h-3 w-28 bg-black/[0.06]" />
      <Skeleton className="mt-3 h-12 w-56 max-w-full bg-black/[0.06]" />
      <Skeleton className="mt-4 h-4 w-72 max-w-full bg-black/[0.05]" />
    </div>
  );
}
