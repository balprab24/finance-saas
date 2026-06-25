'use client';

import {
  ColumnDef,
  ColumnFiltersState,
  Row,
  RowData,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useState } from 'react';
import { type LucideIcon, ChevronLeft, ChevronRight, Search, Trash } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useConfirm } from '@/hooks/use-confirm';
import { cn } from '@/lib/utils';

declare module '@tanstack/react-table' {
  // TanStack declaration merging requires these generic names even though this app only adds static metadata.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    mobileLabel?: string;
    mobileHidden?: boolean;
    mobileAlign?: 'left' | 'right';
  }
}

type Props<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  filterKey: string;
  onDelete: (rows: Row<TData>[]) => void;
  disabled?: boolean;
  bulkActionIcon?: LucideIcon;
  bulkActionLabel?: (count: number) => string;
  bulkActionTitle?: string;
  bulkActionDescription?: string;
  bulkActionTone?: 'danger' | 'neutral';
};

export function DataTable<TData, TValue>({
  columns,
  data,
  filterKey,
  onDelete,
  disabled,
  bulkActionIcon: BulkActionIcon = Trash,
  bulkActionLabel = (count) => `Delete ${count} selected`,
  bulkActionTitle = 'Delete selected rows?',
  bulkActionDescription = 'You are about to perform a bulk delete. This cannot be undone.',
  bulkActionTone = 'danger',
}: Props<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [ConfirmDialog, confirm] = useConfirm(bulkActionTitle, bulkActionDescription);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, rowSelection },
    initialState: { pagination: { pageSize: 20 } },
  });

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const totalCount = data.length;
  const filterValue = (table.getColumn(filterKey)?.getFilterValue() as string) ?? '';

  return (
    <div className="space-y-3">
      <ConfirmDialog />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--aurex-text-3)]" />
          <Input
            placeholder={`Filter by ${filterKey}…`}
            value={filterValue}
            onChange={(event) =>
              table.getColumn(filterKey)?.setFilterValue(event.target.value)
            }
            className="h-9 w-full border-[var(--aurex-border)] bg-[var(--aurex-surface)] pl-8 text-[13px] text-[var(--aurex-text-1)] placeholder:text-[var(--aurex-text-3)] focus-visible:border-[var(--aurex-brand)] focus-visible:ring-1 focus-visible:ring-[var(--aurex-brand)]/40"
          />
        </div>
        {selectedCount > 0 ? (
          <Button
            disabled={disabled}
            size="sm"
            variant="outline"
            className={cn(
              'h-9 sm:ml-auto',
              bulkActionTone === 'danger'
                ? 'border-[var(--aurex-expense-line)] bg-[rgba(192,57,43,0.08)] text-[var(--aurex-expense)] hover:bg-[rgba(192,57,43,0.14)] hover:text-[var(--aurex-expense)]'
                : 'border-[var(--aurex-border)] bg-[var(--aurex-surface)] text-[var(--aurex-text-1)] hover:bg-[var(--aurex-surface-hover)] hover:text-[var(--aurex-text-1)]',
            )}
            onClick={async () => {
              const ok = await confirm();
              if (ok) {
                onDelete(table.getFilteredSelectedRowModel().rows);
                table.resetRowSelection();
              }
            }}
          >
            <BulkActionIcon className="size-3.5 mr-2" />
            {bulkActionLabel(selectedCount)}
          </Button>
        ) : null}
      </div>
      <div className="hidden rounded-md border border-[var(--aurex-border)] bg-[var(--aurex-bg-elev)] sm:block">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-[var(--aurex-border)] hover:bg-transparent"
              >
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  const ariaSort = header.column.getCanSort()
                    ? sorted === 'asc'
                      ? 'ascending'
                      : sorted === 'desc'
                        ? 'descending'
                        : 'none'
                    : undefined;

                  return (
                    <TableHead
                      key={header.id}
                      aria-sort={ariaSort}
                      className="h-10 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[var(--aurex-text-3)]"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="border-[var(--aurex-border)] transition-colors hover:bg-[var(--aurex-surface)] data-[state=selected]:bg-[var(--aurex-brand-soft)]"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2.5 text-[13.5px]">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-[13.5px] text-[var(--aurex-text-3)]"
                >
                  {totalCount === 0 ? (
                    <span>No {filterKey === 'name' ? 'records' : 'transactions'} yet</span>
                  ) : (
                    <span>
                      No matches for{' '}
                      <span className="text-[var(--aurex-text-1)]">&ldquo;{filterValue}&rdquo;</span>
                    </span>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="space-y-2 sm:hidden">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => (
            <div
              key={row.id}
              data-state={row.getIsSelected() && 'selected'}
              className="overflow-hidden rounded-md border border-[var(--aurex-border)] bg-[var(--aurex-bg-elev)] data-[state=selected]:bg-[var(--aurex-brand-soft)]"
            >
              <div className="divide-y divide-[var(--aurex-border)]">
                {row
                  .getVisibleCells()
                  .filter((cell) => !cell.column.columnDef.meta?.mobileHidden)
                  .map((cell) => {
                    const label = cell.column.columnDef.meta?.mobileLabel ?? cell.column.id;
                    const align = cell.column.columnDef.meta?.mobileAlign ?? 'left';

                    return (
                      <div
                        key={cell.id}
                        className="grid grid-cols-[minmax(6.5rem,0.42fr)_minmax(0,1fr)] items-start gap-3 px-3 py-2.5"
                      >
                        <span className="pt-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--aurex-text-3)]">
                          {label}
                        </span>
                        <div
                          className={cn(
                            'min-w-0 text-[13.5px] text-[var(--aurex-text-1)]',
                            align === 'right' && 'justify-self-end text-right',
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-md border border-[var(--aurex-border)] bg-[var(--aurex-bg-elev)] px-4 py-10 text-center text-[13.5px] text-[var(--aurex-text-3)]">
            {totalCount === 0 ? (
              <span>No {filterKey === 'name' ? 'records' : 'transactions'} yet</span>
            ) : (
              <span>
                No matches for{' '}
                <span className="text-[var(--aurex-text-1)]">&ldquo;{filterValue}&rdquo;</span>
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-[12px] text-[var(--aurex-text-3)] tabular-nums">
          {selectedCount > 0 ? (
            <>
              <span className="text-[var(--aurex-text-1)]">{selectedCount}</span> of {filteredCount}{' '}
              selected
            </>
          ) : (
            <>
              {filteredCount === totalCount ? (
                <>
                  <span className="text-[var(--aurex-text-1)]">{totalCount}</span>{' '}
                  {totalCount === 1 ? 'row' : 'rows'}
                </>
              ) : (
                <>
                  <span className="text-[var(--aurex-text-1)]">{filteredCount}</span> of {totalCount}{' '}
                  rows
                </>
              )}
              {table.getPageCount() > 1 ? (
                <>
                  {' '}· page{' '}
                  <span className="text-[var(--aurex-text-1)]">
                    {table.getState().pagination.pageIndex + 1}
                  </span>{' '}
                  of {table.getPageCount()}
                </>
              ) : null}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-[var(--aurex-border)] bg-[var(--aurex-surface)] text-[var(--aurex-text-1)] hover:bg-[var(--aurex-surface-hover)]"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="size-3.5" />
            <span className="ml-1">Previous</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-[var(--aurex-border)] bg-[var(--aurex-surface)] text-[var(--aurex-text-1)] hover:bg-[var(--aurex-surface-hover)]"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="mr-1">Next</span>
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
