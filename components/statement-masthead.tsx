'use client';

import { format } from 'date-fns';
import { useSearchParams } from 'next/navigation';

import { formatDateRange } from '@/lib/utils';
import { AccountFilter } from '@/components/account-filter';
import { DateFilter } from '@/components/date-filter';
import { PageMasthead } from '@/components/page-masthead';
import { useGetSummary } from '@/features/summary/api/use-get-summary';

// The statement masthead: a clear title, the period stated ONCE (so the date stops
// repeating under every figure and section), an "as of" freshness cue, and the
// account/period controls pulled into the document header instead of floating in
// the page corner. Replaces the old eyebrow + greeting + detached filter row.
type Props = {
  isUpdating?: boolean;
};

export function StatementMasthead({ isUpdating = false }: Props) {
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
    <PageMasthead
      title="Statement"
      meta={
        <>
          {period}
          {isUpdating ? (
            <span> · Updating…</span>
          ) : asOf ? (
            <span> · as of {asOf}</span>
          ) : null}
        </>
      }
      actions={
        <>
          <AccountFilter />
          <DateFilter />
        </>
      }
    />
  );
}
