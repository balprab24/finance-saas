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
      return (
        <div className={`flex items-center gap-2 ${archived ? 'text-[var(--aurex-text-3)]' : ''}`}>
          <span>{row.original.name}</span>
          {archived ? (
            <span className="rounded border border-[var(--aurex-border)] bg-[var(--aurex-surface)] px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-[var(--aurex-text-3)]">
              Archived
            </span>
          ) : null}
        </div>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <Actions id={row.original.id} archived={!!row.original.archivedAt} />
    ),
  },
];
