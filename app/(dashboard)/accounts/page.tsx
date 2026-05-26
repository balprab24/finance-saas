'use client';

import { Loader2, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/data-table';

import { columns } from './columns';
import { useNewAccount } from '@/features/accounts/hooks/use-new-account';
import { useGetAccounts } from '@/features/accounts/api/use-get-accounts';
import { useBulkDeleteAccounts } from '@/features/accounts/api/use-bulk-delete-accounts';

export default function AccountsPage() {
  const newAccount = useNewAccount();
  const accountsQuery = useGetAccounts();
  const deleteAccounts = useBulkDeleteAccounts();
  const accounts = accountsQuery.data || [];

  const isDisabled = accountsQuery.isLoading || deleteAccounts.isPending;

  if (accountsQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-screen-2xl pb-16 pt-6">
        <div className="aurex-card p-5">
          <Skeleton className="h-6 w-44 bg-white/8" />
          <div className="mt-5 flex h-[420px] w-full items-center justify-center">
            <Loader2 className="size-5 animate-spin text-[var(--aurex-text-3)]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-5 pb-16 pt-6">
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--aurex-text-3)]">
          Accounts
        </span>
        <h1 className="text-[24px] font-semibold tracking-tight text-[var(--aurex-text-1)] lg:text-[28px]">
          Every wallet, in one place
        </h1>
      </div>
      <div className="aurex-card p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-[15px] font-semibold text-[var(--aurex-text-1)]">
            Your accounts
          </h2>
          <Button
            onClick={newAccount.onOpen}
            size="sm"
            className="h-9 bg-[var(--aurex-brand)] text-white hover:bg-[#7a7df7]"
          >
            <Plus className="mr-2 size-3.5" />
            Add account
          </Button>
        </div>
        <div className="mt-4">
          <DataTable
            filterKey="name"
            columns={columns}
            data={accounts}
            onDelete={(rows) => deleteAccounts.mutate({ ids: rows.map((r) => r.original.id) })}
            disabled={isDisabled}
          />
        </div>
      </div>
    </div>
  );
}
