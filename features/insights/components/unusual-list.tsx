'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';

import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useGetUnusual } from '@/features/insights/api/use-get-unusual';

export function UnusualList() {
  const unusualQuery = useGetUnusual();

  if (unusualQuery.isLoading) {
    return (
      <div className="flex h-[180px] items-center justify-center">
        <Loader2 className="size-5 animate-spin text-[var(--aurex-text-3)]" />
      </div>
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
            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-[rgba(251,191,36,0.12)] ring-1 ring-[rgba(251,191,36,0.24)]">
              <AlertTriangle className="size-4 text-[#fbbf24]" />
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
            <Badge className="border-0 bg-[rgba(251,191,36,0.12)] text-[11px] text-[#fbbf24]">
              {row.isNew ? 'New' : `${row.multiple}× typical`}
            </Badge>
          </div>
        </li>
      ))}
    </ul>
  );
}
