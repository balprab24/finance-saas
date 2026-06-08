'use client';

import { formatCurrency } from '@/lib/utils';
import { MonthFilter } from '@/components/month-filter';
import { RecurringList } from '@/features/insights/components/recurring-list';
import { TrendsList } from '@/features/insights/components/trends-list';
import { UnusualList } from '@/features/insights/components/unusual-list';
import { useGetRecurring } from '@/features/insights/api/use-get-recurring';

export default function InsightsPage() {
  const recurringQuery = useGetRecurring();
  const monthlyTotal = recurringQuery.data?.monthlyTotal ?? 0;
  const count = recurringQuery.data?.recurring.length ?? 0;

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-5 pb-16 pt-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[26px] font-medium tracking-[-0.01em] text-[var(--aurex-text-1)] lg:text-[30px]">
          Insights
        </h1>
      </div>

      {/* Two independent columns that size to their content (items-start), so the
          shorter lists don't get stretched into empty space. Left: the per-merchant
          lists; right: the ranked category movers. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
        <div className="space-y-4">
          <div className="aurex-card p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-[15px] font-semibold text-[var(--aurex-text-1)]">
                Recurring subscriptions
              </h2>
              <span className="text-[12px] text-[var(--aurex-text-3)]">
                ≈ {formatCurrency(monthlyTotal)}/mo · {count}
              </span>
            </div>
            <div className="mt-3">
              <RecurringList />
            </div>
          </div>

          <div className="aurex-card p-5">
            <h2 className="text-[15px] font-semibold text-[var(--aurex-text-1)]">
              Unusual spending
            </h2>
            <div className="mt-3">
              <UnusualList />
            </div>
          </div>
        </div>

        <div className="aurex-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold text-[var(--aurex-text-1)]">
              Category movers
            </h2>
            <MonthFilter />
          </div>
          <div className="mt-3">
            <TrendsList />
          </div>
        </div>
      </div>
    </div>
  );
}
