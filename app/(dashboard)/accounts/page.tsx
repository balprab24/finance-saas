'use client';

import { useState } from 'react';
import { Archive, Loader2, Plus, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/data-table';

import { columns } from './columns';
import { useNewAccount } from '@/features/accounts/hooks/use-new-account';
import { useGetAccounts } from '@/features/accounts/api/use-get-accounts';
import { useBulkArchiveAccounts } from '@/features/accounts/api/use-bulk-archive-accounts';
import { PlaidLinkButton } from '@/features/plaid/components/plaid-link-button';
import { useSyncPlaidItem } from '@/features/plaid/api/use-sync-plaid-item';

export default function AccountsPage() {
  const [showArchived, setShowArchived] = useState(false);
  const newAccount = useNewAccount();
  const accountsQuery = useGetAccounts({ includeArchived: showArchived });
  const archiveAccounts = useBulkArchiveAccounts();
  const syncPlaidItem = useSyncPlaidItem();
  const accounts = accountsQuery.data || [];
  const plaidItemIds = Array.from(
    new Set(
      accounts
        .filter((account) => account.plaidStatus !== 'removed')
        .map((account) => account.plaidItemId)
        .filter((id): id is string => typeof id === 'string' && id.length > 0),
    ),
  );

  const isDisabled = accountsQuery.isLoading || archiveAccounts.isPending || syncPlaidItem.isPending;

  const onSyncLinked = async () => {
    for (const itemId of plaidItemIds) {
      await syncPlaidItem.mutateAsync({ itemId });
    }
  };

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-5 pb-16 pt-6">
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--aurex-text-3)]">
          Accounts
        </span>
        <h1 className="font-display text-[26px] font-medium tracking-[-0.01em] text-[var(--aurex-text-1)] lg:text-[30px]">
          Every wallet, in one place
        </h1>
      </div>
      <div className="aurex-card p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-[15px] font-semibold text-[var(--aurex-text-1)]">
              Your accounts
            </h2>
            <label className="flex cursor-pointer items-center gap-2 text-[12.5px] text-[var(--aurex-text-3)]">
              <Checkbox
                checked={showArchived}
                onCheckedChange={(value) => setShowArchived(!!value)}
                aria-label="Show archived accounts"
              />
              Show archived
            </label>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              onClick={onSyncLinked}
              size="sm"
              variant="outline"
              disabled={isDisabled || plaidItemIds.length === 0}
              className="h-9 border-[var(--aurex-border)] bg-[var(--aurex-surface-2)] text-[var(--aurex-text-1)] hover:bg-[var(--aurex-surface-hover)]"
            >
              {syncPlaidItem.isPending ? (
                <Loader2 className="mr-2 size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 size-3.5" />
              )}
              Sync linked
            </Button>
            <PlaidLinkButton disabled={isDisabled} />
            <Button
              onClick={newAccount.onOpen}
              size="sm"
              className="h-9 bg-[var(--aurex-brand)] text-white hover:bg-[#7a7df7]"
            >
              <Plus className="mr-2 size-3.5" />
              Add account
            </Button>
          </div>
        </div>
        <div className="mt-4">
          {accountsQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full rounded-md bg-white/[0.06]" />
              ))}
            </div>
          ) : (
          <DataTable
            filterKey="name"
            columns={columns}
            data={accounts}
            onDelete={(rows) => {
              const ids = rows
                .filter((r) => !r.original.archivedAt)
                .map((r) => r.original.id);
              if (ids.length === 0) return;
              archiveAccounts.mutate({ ids });
            }}
            disabled={isDisabled}
            bulkActionIcon={Archive}
            bulkActionLabel={(count) => `Archive ${count} selected`}
            bulkActionTitle="Archive selected accounts?"
            bulkActionDescription="This hides the selected accounts from new transactions and account lists. Existing transactions stay intact. Already-archived selections are skipped."
            bulkActionTone="neutral"
          />
          )}
        </div>
      </div>
    </div>
  );
}
