'use client';

import { InferResponseType } from 'hono';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';

import { client } from '@/lib/hono';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Actions } from './actions';

export type ResponseType = InferResponseType<typeof client.api.accounts.$get, 200>['data'][0];

export const columns: ColumnDef<ResponseType>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    meta: {
      mobileLabel: 'Select',
      mobileAlign: 'right',
    },
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Name <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const archived = !!row.original.archivedAt;
      const linked = !!row.original.plaidId;
      const hasPlaidError = row.original.plaidStatus === 'error';
      const repairHint = hasPlaidError
        ? row.original.plaidErrorMessage ||
          'This connection needs attention. Reconnect the bank to resume syncing.'
        : null;

      return (
        <div className={`flex flex-col gap-1 ${archived ? 'text-[var(--aurex-text-3)]' : ''}`}>
          <div className="flex flex-wrap items-center gap-2">
            <span>{row.original.name}</span>
            {linked ? (
              <span className="rounded border border-[var(--aurex-border-strong)] bg-[var(--aurex-surface-2)] px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-[var(--aurex-text-2)]">
                Linked
              </span>
            ) : null}
            {hasPlaidError ? (
              <span className="rounded border border-[var(--aurex-warn-line)] bg-[var(--aurex-warn-soft)] px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-[var(--aurex-warn)]">
                Attention
              </span>
            ) : null}
            {archived ? (
              <span className="rounded border border-[var(--aurex-border)] bg-[var(--aurex-surface)] px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-[var(--aurex-text-3)]">
                Archived
              </span>
            ) : null}
          </div>
          {row.original.institutionName ? (
            <span className="text-[12px] text-[var(--aurex-text-3)]">
              {row.original.institutionName}
            </span>
          ) : null}
          {repairHint ? (
            <span className="text-[12px] text-[var(--aurex-warn)]">{repairHint}</span>
          ) : null}
        </div>
      );
    },
    meta: { mobileLabel: 'Account' },
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <Actions
        id={row.original.id}
        archived={!!row.original.archivedAt}
        plaidItemId={row.original.plaidItemId}
        plaidStatus={row.original.plaidStatus}
      />
    ),
    meta: {
      mobileLabel: 'Actions',
      mobileAlign: 'right',
    },
  },
];
