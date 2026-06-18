'use client';

import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

import { cn, formatCurrency, formatPercentage } from '@/lib/utils';
import { DataError } from '@/components/data-error';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetTrends } from '@/features/insights/api/use-get-trends';

export function TrendsList() {
  const trendsQuery = useGetTrends();

  if (trendsQuery.isLoading) {
    return (
      <div className="space-y-3 py-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md bg-black/[0.05]" />
        ))}
      </div>
    );
  }

  if (trendsQuery.isError && !trendsQuery.data) {
    return (
      <DataError
        className="min-h-[180px] border-0"
        title="Couldn't load category movers"
        message="We couldn't compare this month with the previous one. Try this section again."
        onRetry={() => trendsQuery.refetch()}
      />
    );
  }

  const rows = (trendsQuery.data ?? []).filter((t) => t.change !== 0).slice(0, 10);

  if (rows.length === 0) {
    return (
      <div className="flex h-[140px] items-center justify-center text-center text-[13px] text-[var(--aurex-text-3)]">
        No category changes versus last month.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-[var(--aurex-border)]">
      {rows.map((row) => {
        const up = row.change > 0; // spending increased
        return (
          <li key={row.categoryId} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <div className="truncate text-[14px] font-medium text-[var(--aurex-text-1)]">
                {row.name}
              </div>
              <div className="mt-0.5 text-[12px] text-[var(--aurex-text-3)]">
                {formatCurrency(row.current)} this month · was {formatCurrency(row.previous)}
              </div>
            </div>
            <div
              className={cn(
                'inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium tabular-nums',
                up
                  ? 'bg-[var(--aurex-expense-soft)] text-[var(--aurex-expense)]'
                  : 'bg-[var(--aurex-income-soft)] text-[var(--aurex-income)]',
              )}
            >
              {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
              {formatPercentage(row.percentChange, { addPrefix: true })}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
