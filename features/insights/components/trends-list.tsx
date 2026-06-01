'use client';

import { ArrowDownRight, ArrowUpRight, Loader2 } from 'lucide-react';

import { cn, formatCurrency, formatPercentage } from '@/lib/utils';
import { useGetTrends } from '@/features/insights/api/use-get-trends';

export function TrendsList() {
  const trendsQuery = useGetTrends();

  if (trendsQuery.isLoading) {
    return (
      <div className="flex h-[180px] items-center justify-center">
        <Loader2 className="size-5 animate-spin text-[var(--aurex-text-3)]" />
      </div>
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
                  ? 'bg-[rgba(251,113,133,0.1)] text-[#fb7185]'
                  : 'bg-[rgba(52,211,153,0.1)] text-[#34d399]',
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
