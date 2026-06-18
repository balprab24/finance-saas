'use client';

import { useState } from 'react';
import Link from 'next/link';
import qs from 'query-string';
import { useSearchParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

import { cn, formatCurrency, formatPercentage } from '@/lib/utils';

type Props = {
  data?: { categoryId?: string | null; name: string; value: number }[];
};

// Show the categories that carry the period; the long tail collapses behind a
// single toggle. The Total always sums every category, so the statement stays
// honest whether the tail is open or closed.
const DEFAULT_VISIBLE = 6;

// "Where the money went" as a ranked ledger instead of a donut: each row is a
// category with a graphite share bar (length = magnitude), a right-aligned Geist
// Mono amount, and its share of the period. Decimals align down the column; a
// ruled Total closes the statement. No rainbow palette — identity is the label.
export function CategoryLedger({ data = [] }: Props) {
  const [expanded, setExpanded] = useState(false);
  const params = useSearchParams();

  if (data.length === 0) {
    return (
      <div className="flex h-[260px] flex-col items-center justify-center text-center">
        <p className="text-[13px] text-[var(--aurex-text-3)]">No spending in this period</p>
      </div>
    );
  }

  const rows = [...data].sort((a, b) => b.value - a.value);
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  const max = rows[0]?.value || 1;

  const hasTail = rows.length > DEFAULT_VISIBLE;
  const visibleRows = expanded ? rows : rows.slice(0, DEFAULT_VISIBLE);
  const from = params.get('from') || undefined;
  const to = params.get('to') || undefined;
  const accountId = params.get('accountId') || undefined;

  return (
    <div className="space-y-4">
      <ul className="space-y-3.5">
        {visibleRows.map((row) => {
          const share = total > 0 ? (row.value / total) * 100 : 0;
          const barWidth = Math.max((row.value / max) * 100, 2);
          const href = row.categoryId
            ? qs.stringifyUrl(
                {
                  url: '/transactions',
                  query: { categoryId: row.categoryId, from, to, accountId },
                },
                { skipNull: true, skipEmptyString: true },
              )
            : null;
          const rowContent = (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-[13.5px] text-[var(--aurex-text-2)]">{row.name}</span>
                <span className="shrink-0 font-mono text-[13.5px] font-medium tabular-nums text-[var(--aurex-text-1)]">
                  {formatCurrency(row.value)}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2.5">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--aurex-surface)]">
                  <div
                    className="h-full rounded-full bg-[var(--aurex-bar)]"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className="w-9 shrink-0 text-right font-mono text-[11.5px] tabular-nums text-[var(--aurex-text-3)]">
                  {formatPercentage(share)}
                </span>
              </div>
            </>
          );

          return (
            <li key={row.categoryId ?? row.name}>
              {href ? (
                <Link
                  href={href}
                  aria-label={`View ${row.name} transactions`}
                  className="-mx-2 block rounded-md px-2 py-1.5 transition-colors hover:bg-[var(--aurex-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aurex-brand)]"
                >
                  {rowContent}
                </Link>
              ) : (
                <div className="py-1.5">{rowContent}</div>
              )}
            </li>
          );
        })}
      </ul>

      {hasTail ? (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="-my-1 flex w-full items-center justify-center gap-1 py-2 text-[12px] font-medium text-[var(--aurex-text-3)] transition-colors hover:text-[var(--aurex-text-1)]"
        >
          {expanded ? 'Show fewer' : `Show all ${rows.length} categories`}
          <ChevronDown
            className={cn('size-3.5 transition-transform', expanded && 'rotate-180')}
            aria-hidden
          />
        </button>
      ) : null}

      <div className="flex items-baseline justify-between border-t border-[var(--aurex-border)] pt-3">
        <span className="text-[12px] font-medium text-[var(--aurex-text-3)]">Total</span>
        <span className="font-mono text-[14px] font-semibold tabular-nums text-[var(--aurex-text-1)]">
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  );
}
