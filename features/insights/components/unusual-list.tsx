'use client';

import { AlertTriangle } from 'lucide-react';

import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { DataError } from '@/components/data-error';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetUnusual } from '@/features/insights/api/use-get-unusual';

export function UnusualList() {
  const unusualQuery = useGetUnusual();

  if (unusualQuery.isLoading) {
    return (
      <div className="space-y-3 py-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-md bg-black/[0.05]" />
        ))}
      </div>
    );
  }

  if (unusualQuery.isError && !unusualQuery.data) {
    return (
      <DataError
        className="min-h-[180px] border-0"
        title="Couldn't load unusual spending"
        message="We couldn't compare this month with your recent activity. Try this section again."
        onRetry={() => unusualQuery.refetch()}
      />
    );
  }

  const rows = unusualQuery.data ?? [];

  if (rows.length === 0) {
    return (
      <div className="flex h-[140px] items-center justify-center text-center text-[13px] text-[var(--aurex-text-3)]">
        Nothing unusual this month — spending is in line with recent months.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-[var(--aurex-border)]">
      {rows.map((row) => (
        <li key={row.categoryId} className="flex items-center justify-between gap-3 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-[var(--aurex-warn-soft)] ring-1 ring-[var(--aurex-warn-line)]">
              <AlertTriangle className="size-4 text-[var(--aurex-warn)]" />
            </span>
            <div className="min-w-0">
              <div className="truncate text-[14px] font-medium text-[var(--aurex-text-1)]">
                {row.name}
              </div>
              <div className="mt-0.5 text-[12px] text-[var(--aurex-text-3)]">
                {row.isNew
                  ? 'New spending this month'
                  : `Typically ${formatCurrency(row.trailingAvg)}/mo`}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="tabular-nums text-[14px] font-semibold text-[var(--aurex-text-1)]">
              {formatCurrency(row.current)}
            </span>
            <Badge className="border-0 bg-[var(--aurex-warn-soft)] text-[11px] text-[var(--aurex-warn)]">
              {row.isNew ? 'New' : `${row.multiple}× typical`}
            </Badge>
          </div>
        </li>
      ))}
    </ul>
  );
}
