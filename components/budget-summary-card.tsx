'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowRight, PiggyBank } from 'lucide-react';

import { cn, formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetBudgets } from '@/features/budgets/api/use-get-budgets';

export function BudgetSummaryCard() {
  const month = format(new Date(), 'yyyy-MM');
  const budgetsQuery = useGetBudgets(month);

  if (budgetsQuery.isLoading) {
    return (
      <div className="aurex-card h-[170px] p-5">
        <Skeleton className="h-3 w-28 bg-white/8" />
        <Skeleton className="mt-4 h-8 w-32 bg-white/8" />
        <Skeleton className="mt-4 h-2 w-full bg-white/8" />
      </div>
    );
  }

  const totalBudgeted = budgetsQuery.data?.totalBudgeted ?? 0;
  const totalSpent = budgetsQuery.data?.totalSpent ?? 0;
  const totalRemaining = budgetsQuery.data?.totalRemaining ?? 0;
  const hasBudgets = totalBudgeted > 0;
  const percent = hasBudgets ? Math.min((totalSpent / totalBudgeted) * 100, 100) : 0;
  const over = totalRemaining < 0;

  return (
    <div className="aurex-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-[13px] font-medium text-[var(--aurex-text-3)]">
            Budget · {format(new Date(), 'LLLL')}
          </div>
          <div className="text-[28px] font-semibold tracking-tight tabular-nums text-[var(--aurex-text-1)] sm:text-[32px]">
            {formatCurrency(totalSpent)}
            <span className="text-[14px] font-normal text-[var(--aurex-text-3)]">
              {' '}/ {formatCurrency(totalBudgeted)}
            </span>
          </div>
        </div>
        <div className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[rgba(99,102,241,0.12)] ring-1 ring-[rgba(99,102,241,0.22)]">
          <PiggyBank className="size-[18px] text-[#a5b4fc]" />
        </div>
      </div>

      {hasBudgets ? (
        <>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[var(--aurex-surface)] ring-1 ring-[var(--aurex-border)]">
            <div
              className={cn('h-full rounded-full', over ? 'bg-[#fb7185]' : 'bg-[var(--aurex-brand)]')}
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-[12px]">
            <span className={over ? 'text-[#fb7185]' : 'text-[var(--aurex-text-3)]'}>
              {over
                ? `${formatCurrency(Math.abs(totalRemaining))} over budget`
                : `${formatCurrency(totalRemaining)} remaining`}
            </span>
            <Link
              href="/budgets"
              className="inline-flex items-center gap-1 font-medium text-[#a5b4fc] hover:text-[#c7d2fe]"
            >
              Manage <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </>
      ) : (
        <div className="mt-4 flex items-center justify-between text-[12px] text-[var(--aurex-text-3)]">
          <span>No budgets set for this month.</span>
          <Link
            href="/budgets"
            className="inline-flex items-center gap-1 font-medium text-[#a5b4fc] hover:text-[#c7d2fe]"
          >
            Set budgets <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
