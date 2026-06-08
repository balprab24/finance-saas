'use client';

import { InferResponseType } from 'hono';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';

import { client } from '@/lib/hono';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn, formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Actions } from './actions';
import { AccountColumn } from './account-column';
import { CategoryColumn } from './category-column';

export type ResponseType = InferResponseType<typeof client.api.transactions.$get, 200>['data'][0];

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
  },
  {
    accessorKey: 'date',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Date <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.getValue('date') as Date;
      return <span>{format(new Date(date), 'dd MMM, yyyy')}</span>;
    },
  },
  {
    accessorKey: 'category',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Category <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <CategoryColumn id={row.original.id} category={row.original.category} categoryId={row.original.categoryId} />
    ),
  },
  {
    accessorKey: 'payee',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Payee <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Amount <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('amount'));
      // Color by financial meaning (Light Counter): income green, expense red,
      // zero neutral graphite — never a solid ink "highlight" pill.
      const tone =
        amount > 0
          ? 'border-0 bg-[rgba(17,122,75,0.1)] text-[#117a4b]'
          : amount < 0
            ? 'border-0 bg-[rgba(192,57,43,0.1)] text-[#c0392b]'
            : 'border-0 bg-[var(--aurex-surface)] text-[var(--aurex-text-2)]';
      return (
        <Badge className={cn('px-3.5 py-2.5 font-mono text-xs font-medium tabular-nums', tone)}>
          {formatCurrency(amount)}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'account',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Account <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => <AccountColumn account={row.original.account} accountId={row.original.accountId} />,
  },
  {
    id: 'actions',
    cell: ({ row }) => <Actions id={row.original.id} />,
  },
];
