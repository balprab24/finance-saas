'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowRight, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';

import { formatCurrency, formatPercentage } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetRecurring } from '@/features/insights/api/use-get-recurring';
import { useGetTrends } from '@/features/insights/api/use-get-trends';

export function InsightsTeaserCard() {
  const month = format(new Date(), 'yyyy-MM');
  const recurringQuery = useGetRecurring();
  const trendsQuery = useGetTrends(month);

  if (recurringQuery.isLoading || trendsQuery.isLoading) {
    return (
      <div className="aurex-card h-[170px] p-5">
        <Skeleton className="h-3 w-28 bg-white/8" />
        <Skeleton className="mt-4 h-8 w-32 bg-white/8" />
        <Skeleton className="mt-4 h-4 w-full bg-white/8" />
      </div>
    );
  }

  const monthlyTotal = recurringQuery.data?.monthlyTotal ?? 0;
  const count = recurringQuery.data?.recurring.length ?? 0;
  const topMover = (trendsQuery.data ?? []).find((t) => t.change !== 0);
  const up = (topMover?.change ?? 0) > 0;

  return (
    <div className="aurex-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-[13px] font-medium text-[var(--aurex-text-3)]">Insights</div>
          <div className="text-[28px] font-semibold tracking-tight tabular-nums text-[var(--aurex-text-1)] sm:text-[32px]">
            {formatCurrency(monthlyTotal)}
            <span className="text-[14px] font-normal text-[var(--aurex-text-3)]">/mo recurring</span>
          </div>
        </div>
        <div className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[rgba(99,102,241,0.12)] ring-1 ring-[rgba(99,102,241,0.22)]">
          <Sparkles className="size-[18px] text-[#a5b4fc]" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-[12px]">
        {topMover ? (
          <span className="inline-flex items-center gap-1.5 text-[var(--aurex-text-3)]">
            {up ? (
              <TrendingUp className="size-3.5 text-[#fb7185]" />
            ) : (
              <TrendingDown className="size-3.5 text-[#34d399]" />
            )}
            <span className="text-[var(--aurex-text-2)]">{topMover.name}</span>
            <span className={up ? 'text-[#fb7185]' : 'text-[#34d399]'}>
              {formatPercentage(topMover.percentChange, { addPrefix: true })}
            </span>
          </span>
        ) : (
          <span className="text-[var(--aurex-text-3)]">
            {count} recurring {count === 1 ? 'merchant' : 'merchants'}
          </span>
        )}
        <Link
          href="/insights"
          className="inline-flex items-center gap-1 font-medium text-[#a5b4fc] hover:text-[#c7d2fe]"
        >
          View <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
