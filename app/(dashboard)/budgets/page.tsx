'use client';

import { formatCurrency } from '@/lib/utils';
import { MonthFilter } from '@/components/month-filter';
import { BudgetsTable } from '@/features/budgets/components/budgets-table';
import { useGetBudgets } from '@/features/budgets/api/use-get-budgets';

export default function BudgetsPage() {
  const budgetsQuery = useGetBudgets();
  const totals = budgetsQuery.data;

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-5 pb-16 pt-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[26px] font-medium tracking-[-0.01em] text-[var(--aurex-text-1)] lg:text-[30px]">
          Budgets
        </h1>
      </div>

      <div className="aurex-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--aurex-text-3)]">
                Budgeted
              </div>
              <div className="text-[18px] font-semibold tabular-nums text-[var(--aurex-text-1)]">
                {formatCurrency(totals?.totalBudgeted ?? 0)}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--aurex-text-3)]">
                Spent
              </div>
              <div className="text-[18px] font-semibold tabular-nums text-[var(--aurex-text-1)]">
                {formatCurrency(totals?.totalSpent ?? 0)}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--aurex-text-3)]">
                Remaining
              </div>
              <div
                className={
                  (totals?.totalRemaining ?? 0) < 0
                    ? 'text-[18px] font-semibold tabular-nums text-[#c0392b]'
                    : 'text-[18px] font-semibold tabular-nums text-[var(--aurex-text-1)]'
                }
              >
                {formatCurrency(totals?.totalRemaining ?? 0)}
              </div>
            </div>
          </div>
          <MonthFilter />
        </div>
        <div className="mt-5">
          <BudgetsTable />
        </div>
      </div>
    </div>
  );
}
