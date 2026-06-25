'use client';

import { Row } from '@tanstack/react-table';
import { format } from 'date-fns';
import { TriangleAlert } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { LedgerAmount } from '@/components/money';
import { cn } from '@/lib/utils';

import { Actions } from './actions';
import type { ResponseType } from './columns';

// Purpose-built mobile card for a transaction row. Instead of transposing every
// column into a stacked label/value list, it reads like a statement line:
// payee + signed amount up top, then date · category · account as plain
// metadata beneath. Selection (checkbox) and editing (the ⋯ menu, which opens
// the full transaction sheet) are the only interactive affordances — the
// metadata line is deliberately not tappable, so a muted 12px label never hides
// a sheet-opening target the user can't see and could mis-tap.
function TransactionCard({ row }: { row: Row<ResponseType> }) {
  const { date, payee, amount, category, account } = row.original;
  // amount arrives in dollars (already converted server-side), same as columns.tsx.
  const value = parseFloat(String(amount));

  return (
    <div className="flex items-start gap-3 px-3 py-3">
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(checked) => row.toggleSelected(!!checked)}
        aria-label={`Select ${payee}`}
        className="mt-1 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="min-w-0 truncate text-[13.5px] font-medium text-[var(--aurex-text-1)]">
            {payee}
          </span>
          <LedgerAmount value={value} signed className="shrink-0 text-[13.5px] font-medium" />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12px] text-[var(--aurex-text-3)]">
          <span className="whitespace-nowrap tabular-nums">
            {format(new Date(date), 'dd MMM, yyyy')}
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1',
              !category && 'text-[var(--aurex-warn)]',
            )}
          >
            <span aria-hidden className="mr-1.5">
              ·
            </span>
            {!category && <TriangleAlert className="size-3 shrink-0" aria-hidden />}
            {category ?? 'Uncategorized'}
          </span>
          <span className="whitespace-nowrap">
            <span aria-hidden className="mr-1.5">
              ·
            </span>
            {account ?? 'Unknown'}
          </span>
        </div>
      </div>
      <Actions
        id={row.original.id}
        className="relative -mr-1 size-9 shrink-0 after:absolute after:-inset-1.5"
      />
    </div>
  );
}

export function renderTransactionMobileRow(row: Row<ResponseType>) {
  return <TransactionCard row={row} />;
}
