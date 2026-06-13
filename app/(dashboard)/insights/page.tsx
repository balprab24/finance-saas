'use client';

import { formatCurrency } from '@/lib/utils';
import { MonthFilter } from '@/components/month-filter';
import { PageMasthead } from '@/components/page-masthead';
import { StatementSheet } from '@/components/statement-sheet';
import { StatementSection } from '@/components/statement-section';
import { RecurringList } from '@/features/insights/components/recurring-list';
import { TrendsList } from '@/features/insights/components/trends-list';
import { UnusualList } from '@/features/insights/components/unusual-list';
import { useGetRecurring } from '@/features/insights/api/use-get-recurring';

export default function InsightsPage() {
  const recurringQuery = useGetRecurring();
  const monthlyTotal = recurringQuery.data?.monthlyTotal ?? 0;
  const count = recurringQuery.data?.recurring.length ?? 0;

  return (
    <StatementSheet
      masthead={
        <PageMasthead title="Insights" meta="Recurring · unusual · category movers" actions={<MonthFilter />} />
      }
    >
      {/* One sheet, three ruled panels. Left column stacks the per-merchant lists,
          divided by a hairline; right column carries the ranked category movers. */}
      <div className="grid grid-cols-1 divide-y divide-[var(--aurex-border)] lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        <div className="divide-y divide-[var(--aurex-border)]">
          <StatementSection
            title="Recurring subscriptions"
            caption={`≈ ${formatCurrency(monthlyTotal)}/mo · ${count} detected`}
          >
            <RecurringList />
          </StatementSection>
          <StatementSection title="Unusual spending">
            <UnusualList />
          </StatementSection>
        </div>

        <StatementSection title="Category movers">
          <TrendsList />
        </StatementSection>
      </div>
    </StatementSheet>
  );
}
