'use client';

import { Row } from '@tanstack/react-table';
import { format } from 'date-fns';

import { Checkbox } from '@/components/ui/checkbox';
import { LedgerAmount } from '@/components/money';

import { Actions } from './actions';
import { AccountColumn } from './account-column';
import { CategoryColumn } from './category-column';
import type { ResponseType } from './columns';

// Purpose-built mobile card for a transaction row. Instead of transposing every
// column into a stacked label/value list, it reads like a statement line:
// payee + signed amount up top, then date · category · account beneath, with
// select and the row actions as quiet affordances. Composed from the same
// primitives the desktop columns use so interactions and styling stay identical.
function TransactionCard({ row }: { row: Row<ResponseType> }) {
  const { date, payee, amount } = row.original;
  // amount arrives in dollars (already converted server-side), same as columns.tsx.
  const value = parseFloat(String(amount));

  return (
    <div className="flex items-start gap-3 px-3 py-2.5">
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(checked) => row.toggleSelected(!!checked)}
        aria-label="Select transaction"
        className="mt-0.5 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="min-w-0 truncate text-[13.5px] font-medium text-[var(--aurex-text-1)]">
            {payee}
          </span>
          <LedgerAmount value={value} signed className="shrink-0 text-[13.5px] font-medium" />
        </div>
        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12px] text-[var(--aurex-text-3)]">
          <span className="tabular-nums">{format(new Date(date), 'dd MMM, yyyy')}</span>
          <span aria-hidden>·</span>
          <CategoryColumn
            id={row.original.id}
            category={row.original.category}
            categoryId={row.original.categoryId}
          />
          <span aria-hidden>·</span>
          <AccountColumn account={row.original.account} accountId={row.original.accountId} />
        </div>
      </div>
      <div className="-mr-1 shrink-0">
        <Actions id={row.original.id} />
      </div>
    </div>
  );
}

export function renderTransactionMobileRow(row: Row<ResponseType>) {
  return <TransactionCard row={row} />;
}
