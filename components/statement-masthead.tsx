'use client';

import { format } from 'date-fns';
import { useSearchParams } from 'next/navigation';

import { formatDateRange } from '@/lib/utils';
import { AccountFilter } from '@/components/account-filter';
import { DateFilter } from '@/components/date-filter';
import { useGetSummary } from '@/features/summary/api/use-get-summary';

// The statement masthead: a clear title, the period stated ONCE (so the date stops
// repeating under every figure and section), an "as of" freshness cue, and the
// account/period controls pulled into the document header instead of floating in
// the page corner. Replaces the old eyebrow + greeting + detached filter row.
export function StatementMasthead() {
  const params = useSearchParams();
  const from = params.get('from') || undefined;
  const to = params.get('to') || undefined;
  const period = formatDateRange({ from, to });

  // "as of" reflects the data's own fetch time, not render time, so the freshness
  // cue stays honest; while a filter change refetches we say "Updating…" instead of
  // showing a fresh timestamp over stale figures. Same query key as CashPosition, so
  // React Query dedupes it (no extra request).
  const summary = useGetSummary();
  const asOf = summary.dataUpdatedAt
    ? format(new Date(summary.dataUpdatedAt), 'MMM d, h:mm a')
    : null;

  return (
    <div className="flex flex-col gap-3 border-b border-[var(--aurex-rule)] p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-[22px] font-medium leading-tight tracking-[-0.01em] text-[var(--aurex-text-1)] sm:text-[26px]">
          Statement
        </h1>
        <p className="mt-0.5 text-[12.5px] tabular-nums text-[var(--aurex-text-3)]">
          {period}
          {summary.isFetching ? (
            <span> · Updating…</span>
          ) : asOf ? (
            <span> · as of {asOf}</span>
          ) : null}
        </p>
      </div>
      <div className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:items-center">
        <AccountFilter />
        <DateFilter />
      </div>
    </div>
  );
}
