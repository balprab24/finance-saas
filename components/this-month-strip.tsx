'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowRight, PiggyBank, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';

import { cn, formatCurrency, formatPercentage } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { DataError } from '@/components/data-error';
import { useGetBudgets } from '@/features/budgets/api/use-get-budgets';
import { useGetRecurring } from '@/features/insights/api/use-get-recurring';
import { useGetTrends } from '@/features/insights/api/use-get-trends';

const REGION = 'flex min-h-[150px] flex-col p-5';

// One full-width "this month" panel replacing the two repeated teaser cards. A
// single flat surface split by a hairline into Budget and Insights regions; each
// keeps its own identity (progress bar / trend row) and link. The 40px tinted
// icon box from the KPI cards is intentionally dropped so the strip stops
// mirroring the KPI row — a small inline icon carries identity instead.
export function ThisMonthStrip() {
  return (
    <div className="grid grid-cols-1 divide-y divide-[var(--aurex-border)] lg:grid-cols-2 lg:divide-x lg:divide-y-0">
      <BudgetRegion />
      <InsightsRegion />
    </div>
  );
}

function RegionLabel({ icon: Icon, children }: { icon: typeof PiggyBank; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--aurex-text-3)]">
      <Icon className="size-3.5 text-[var(--aurex-text-3)]" />
      {children}
    </div>
  );
}

function RegionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 font-medium text-[#16181d] hover:text-[#3a414b]"
    >
      {children} <ArrowRight className="size-3.5" />
    </Link>
  );
}

function BudgetRegion() {
  const month = format(new Date(), 'yyyy-MM');
  const budgetsQuery = useGetBudgets(month);

  if (budgetsQuery.isLoading) {
    return (
      <div className={REGION}>
        <Skeleton className="h-3 w-28 bg-black/[0.06]" />
        <Skeleton className="mt-4 h-8 w-32 bg-black/[0.06]" />
        <Skeleton className="mt-auto h-2 w-full bg-black/[0.06]" />
      </div>
    );
  }

  if (budgetsQuery.isError && !budgetsQuery.data) {
    return (
      <DataError
        className="min-h-[150px] border-0"
        title="Couldn't load budget"
        message="We couldn't reach this month's budget. Try again."
        onRetry={() => budgetsQuery.refetch()}
      />
    );
  }

  const totalBudgeted = budgetsQuery.data?.totalBudgeted ?? 0;
  const totalSpent = budgetsQuery.data?.totalSpent ?? 0;
  const totalRemaining = budgetsQuery.data?.totalRemaining ?? 0;
  const hasBudgets = totalBudgeted > 0;
  const percent = hasBudgets ? Math.min((totalSpent / totalBudgeted) * 100, 100) : 0;
  const over = totalRemaining < 0;

  return (
    <div className={cn(REGION, 'justify-between gap-4')}>
      <div className="space-y-1">
        <RegionLabel icon={PiggyBank}>Budget · {format(new Date(), 'LLLL')}</RegionLabel>
        <div className="text-[28px] font-semibold tracking-tight text-[var(--aurex-text-1)] line-clamp-1 sm:text-[32px]">
          <span className="font-display tabular-nums">{formatCurrency(totalSpent)}</span>
          <span className="text-[14px] font-normal text-[var(--aurex-text-3)]">
            {' '}/ {formatCurrency(totalBudgeted)}
          </span>
        </div>
      </div>

      {hasBudgets ? (
        <div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--aurex-surface)] ring-1 ring-[var(--aurex-border)]">
            <div
              className={cn('h-full rounded-full', over ? 'bg-[#c0392b]' : 'bg-[var(--aurex-brand)]')}
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-[12px]">
            <span className={over ? 'text-[#c0392b]' : 'text-[var(--aurex-text-3)]'}>
              {over
                ? `${formatCurrency(Math.abs(totalRemaining))} over budget`
                : `${formatCurrency(totalRemaining)} remaining`}
            </span>
            <RegionLink href="/budgets">Manage</RegionLink>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between text-[12px] text-[var(--aurex-text-3)]">
          <span>No budgets set for this month.</span>
          <RegionLink href="/budgets">Set budgets</RegionLink>
        </div>
      )}
    </div>
  );
}

function InsightsRegion() {
  const month = format(new Date(), 'yyyy-MM');
  const recurringQuery = useGetRecurring();
  const trendsQuery = useGetTrends(month);

  if (recurringQuery.isLoading || trendsQuery.isLoading) {
    return (
      <div className={REGION}>
        <Skeleton className="h-3 w-28 bg-black/[0.06]" />
        <Skeleton className="mt-4 h-8 w-32 bg-black/[0.06]" />
        <Skeleton className="mt-auto h-4 w-full bg-black/[0.06]" />
      </div>
    );
  }

  if (
    (recurringQuery.isError && !recurringQuery.data) ||
    (trendsQuery.isError && !trendsQuery.data)
  ) {
    return (
      <DataError
        className="min-h-[150px] border-0"
        title="Couldn't load insights"
        message="We couldn't reach your recurring and trend data. Try again."
        onRetry={() => {
          recurringQuery.refetch();
          trendsQuery.refetch();
        }}
      />
    );
  }

  const monthlyTotal = recurringQuery.data?.monthlyTotal ?? 0;
  const count = recurringQuery.data?.recurring.length ?? 0;
  const topMover = (trendsQuery.data ?? []).find((t) => t.change !== 0);
  const up = (topMover?.change ?? 0) > 0;

  return (
    <div className={cn(REGION, 'justify-between gap-4')}>
      <div className="space-y-1">
        <RegionLabel icon={Sparkles}>Insights</RegionLabel>
        <div className="text-[28px] font-semibold tracking-tight text-[var(--aurex-text-1)] line-clamp-1 sm:text-[32px]">
          <span className="font-display tabular-nums">{formatCurrency(monthlyTotal)}</span>
          <span className="text-[14px] font-normal text-[var(--aurex-text-3)]">/mo recurring</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 text-[12px]">
        {topMover ? (
          <span
            className="inline-flex min-w-0 items-center gap-1.5"
            aria-label={`${topMover.name} spending ${up ? 'up' : 'down'} ${formatPercentage(Math.abs(topMover.percentChange))} versus last month`}
          >
            <span className="truncate text-[var(--aurex-text-2)]">{topMover.name}</span>
            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-0.5 font-medium tabular-nums',
                up ? 'text-[#c0392b]' : 'text-[#117a4b]',
              )}
            >
              {up ? (
                <TrendingUp className="size-3.5" aria-hidden />
              ) : (
                <TrendingDown className="size-3.5" aria-hidden />
              )}
              {formatPercentage(topMover.percentChange, { addPrefix: true })}
            </span>
          </span>
        ) : (
          <span className="text-[var(--aurex-text-3)]">
            {count} recurring {count === 1 ? 'merchant' : 'merchants'}
          </span>
        )}
        <RegionLink href="/insights">View</RegionLink>
      </div>
    </div>
  );
}
