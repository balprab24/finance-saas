'use client';

import { useState } from 'react';
import CurrencyInput from 'react-currency-input-field';
import { format } from 'date-fns';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, PiggyBank, Plus, X } from 'lucide-react';

import { cn, convertAmountToMiliunits, formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useGetBudgets } from '@/features/budgets/api/use-get-budgets';
import { useUpsertBudget } from '@/features/budgets/api/use-upsert-budget';
import { useDeleteBudget } from '@/features/budgets/api/use-delete-budget';

type BudgetRow = NonNullable<ReturnType<typeof useGetBudgets>['data']>['categories'][number];

function ProgressBar({ percent, over }: { percent: number; over: boolean }) {
  const width = Math.min(Math.max(percent, 0), 100);
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--aurex-surface)] ring-1 ring-[var(--aurex-border)]">
      <div
        className={cn(
          'h-full rounded-full transition-all',
          over ? 'bg-[#c0392b]' : 'bg-[var(--aurex-brand)]',
        )}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function BudgetAmountCell({
  row,
  disabled,
  onSave,
}: {
  row: BudgetRow;
  disabled: boolean;
  onSave: (categoryId: string, dollars: number) => void;
}) {
  const [value, setValue] = useState(row.budgeted !== null ? String(row.budgeted) : '');

  const commit = () => {
    const parsed = parseFloat(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    if (row.budgeted !== null && parsed === row.budgeted) return;
    onSave(row.categoryId, parsed);
  };

  return (
    <CurrencyInput
      prefix="$"
      placeholder="Set budget"
      value={value}
      decimalsLimit={2}
      decimalScale={2}
      disabled={disabled}
      onValueChange={(v) => setValue(v ?? '')}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      }}
      className="h-9 w-32 rounded-md border border-[var(--aurex-border)] bg-[var(--aurex-surface)] px-3 text-sm text-[var(--aurex-text-1)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--aurex-brand)] disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
}

export function BudgetsTable() {
  const params = useSearchParams();
  const month = params.get('month') || format(new Date(), 'yyyy-MM');

  const budgetsQuery = useGetBudgets();
  const upsert = useUpsertBudget();
  const del = useDeleteBudget();

  const disabled = upsert.isPending || del.isPending;

  const onSave = (categoryId: string, dollars: number) =>
    upsert.mutate({ categoryId, month, amount: convertAmountToMiliunits(dollars) });

  if (budgetsQuery.isLoading) {
    return (
      <div className="flex h-[420px] w-full items-center justify-center">
        <Loader2 className="size-5 animate-spin text-[var(--aurex-text-3)]" />
      </div>
    );
  }

  const rows = budgetsQuery.data?.categories ?? [];

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={PiggyBank}
        title="No budgets yet"
        message="Budgets are set per category. Create a category first, then set a monthly amount for it here."
        action={
          <Link
            href="/categories"
            className="inline-flex h-9 items-center rounded-md bg-[var(--aurex-brand)] px-3 text-[13px] font-medium text-white transition-colors hover:bg-[#2b2f36]"
          >
            <Plus className="mr-2 size-3.5" />
            Add a category
          </Link>
        }
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-[var(--aurex-border)] hover:bg-transparent">
          <TableHead className="text-[var(--aurex-text-3)]">Category</TableHead>
          <TableHead className="text-[var(--aurex-text-3)]">Budget</TableHead>
          <TableHead className="text-[var(--aurex-text-3)]">Spent</TableHead>
          <TableHead className="w-[28%] text-[var(--aurex-text-3)]">Progress</TableHead>
          <TableHead className="text-right text-[var(--aurex-text-3)]">Remaining</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const over = row.status === 'over';
          const hasBudget = row.budgeted !== null;
          const percent = hasBudget && row.budgeted! > 0 ? (row.spent / row.budgeted!) * 100 : 0;
          return (
            <TableRow key={row.categoryId} className="border-[var(--aurex-border)] hover:bg-[var(--aurex-surface)]">
              <TableCell className="font-medium text-[var(--aurex-text-1)]">{row.name}</TableCell>
              <TableCell>
                <BudgetAmountCell row={row} disabled={disabled} onSave={onSave} />
              </TableCell>
              <TableCell className="tabular-nums text-[var(--aurex-text-2)]">
                {formatCurrency(row.spent)}
              </TableCell>
              <TableCell>
                {hasBudget ? (
                  <div className="flex items-center gap-3">
                    <ProgressBar percent={percent} over={over} />
                    <Badge
                      className={cn(
                        'shrink-0 border-0 text-[11px]',
                        over
                          ? 'bg-[rgba(192,57,43,0.12)] text-[#c0392b]'
                          : 'bg-[rgba(17,122,75,0.12)] text-[#117a4b]',
                      )}
                    >
                      {over ? 'Over' : 'On track'}
                    </Badge>
                  </div>
                ) : (
                  <span className="text-[12px] text-[var(--aurex-text-3)]">No budget set</span>
                )}
              </TableCell>
              <TableCell
                className={cn(
                  'text-right tabular-nums',
                  over ? 'text-[#c0392b]' : 'text-[var(--aurex-text-1)]',
                )}
              >
                {row.remaining === null ? '—' : formatCurrency(row.remaining)}
              </TableCell>
              <TableCell>
                {row.budgetId ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={disabled}
                    onClick={() => del.mutate({ id: row.budgetId! })}
                    className="size-8 p-0 text-[var(--aurex-text-3)] hover:bg-[var(--aurex-surface-hover)] hover:text-[#c0392b]"
                    aria-label={`Clear budget for ${row.name}`}
                  >
                    <X className="size-4" />
                  </Button>
                ) : null}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
