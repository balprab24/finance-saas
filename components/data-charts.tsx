'use client';

import { useGetSummary } from '@/features/summary/api/use-get-summary';
import { Skeleton } from '@/components/ui/skeleton';
import { DataError } from '@/components/data-error';
import { StatementSection } from '@/components/statement-section';
import { CashFlowFigure } from '@/components/cash-flow-figure';
import { CategoryLedger } from '@/components/category-ledger';
import { CASH_FLOW_COLORS } from '@/lib/colors';

const SECTION = 'border-b border-[var(--aurex-rule)]';

// The statement's middle band: a hairline-divided grid of the Cash flow figure and
// the ranked category ledger. No card of its own — it is a section inside the one
// dashboard sheet. The period is stated once in the masthead, so the sections drop
// their own date captions.
export function DataCharts() {
  const { data, isLoading, isError, refetch } = useGetSummary();

  if (isLoading) return <DataChartsLoading />;

  // Mirror CashPosition: surface a retryable error instead of an empty statement
  // when the summary fails to load and there is no stale data to fall back to.
  if (isError && !data) {
    return (
      <div className={`${SECTION} p-5 sm:p-6`}>
        <DataError
          className="min-h-[260px] border-0"
          title="Couldn't load your statement"
          message="We couldn't reach your cash-flow and category data. Check your connection and try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const days = data?.days ?? [];
  const categories = data?.categories ?? [];
  const hasFlow = days.some((d) => d.income !== 0 || d.expenses !== 0);

  return (
    <div className={SECTION}>
      <div className="grid grid-cols-1 divide-y divide-[var(--aurex-border)] lg:grid-cols-[1.6fr_1fr] lg:divide-x lg:divide-y-0">
        <StatementSection title="Cash flow" action={<CashFlowLegend />}>
          {hasFlow ? (
            <CashFlowFigure data={days} />
          ) : (
            <RegionEmpty label="No cash flow in this period" />
          )}
        </StatementSection>

        <StatementSection title="Where it went">
          <CategoryLedger data={categories} />
        </StatementSection>
      </div>
    </div>
  );
}

function CashFlowLegend() {
  return (
    <div className="flex items-center gap-3 text-[11.5px] text-[var(--aurex-text-2)]">
      <span className="inline-flex items-center gap-1.5">
        <span
          className="size-1.5 rounded-full"
          style={{ backgroundColor: CASH_FLOW_COLORS.income }}
        />
        Income
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span
          className="size-1.5 rounded-full"
          style={{ backgroundColor: CASH_FLOW_COLORS.expenses }}
        />
        Expenses
      </span>
    </div>
  );
}

function RegionEmpty({ label }: { label: string }) {
  return (
    <div className="flex h-[220px] flex-col items-center justify-center text-center sm:h-[300px]">
      <p className="text-[13px] text-[var(--aurex-text-3)]">{label}</p>
    </div>
  );
}

// Skeleton matches the real section geometry (chart + ranked rows) so the page does
// not reflow when data lands.
function DataChartsLoading() {
  return (
    <div className={SECTION}>
      <div className="grid grid-cols-1 divide-y divide-[var(--aurex-border)] lg:grid-cols-[1.6fr_1fr] lg:divide-x lg:divide-y-0">
        <div className="p-5">
          <div className="flex items-center justify-between border-b border-[var(--aurex-border)] pb-3">
            <Skeleton className="h-5 w-28 bg-black/[0.06]" />
            <Skeleton className="h-3 w-32 bg-black/[0.06]" />
          </div>
          <Skeleton className="mt-4 h-[220px] w-full rounded-md bg-black/[0.05] sm:h-[300px]" />
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between border-b border-[var(--aurex-border)] pb-3">
            <Skeleton className="h-5 w-28 bg-black/[0.06]" />
          </div>
          <div className="mt-4 space-y-3.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-full bg-black/[0.06]" />
                <Skeleton className="h-1.5 w-full bg-black/[0.05]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
