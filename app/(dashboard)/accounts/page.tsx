'use client';

import { useState } from 'react';
import { Archive, Loader2, Plus, RefreshCw, Wallet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/data-table';
import { DataError } from '@/components/data-error';
import { EmptyState } from '@/components/empty-state';
import { PageMasthead } from '@/components/page-masthead';
import { StatementSheet } from '@/components/statement-sheet';

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

  // When the active list is empty, probe whether archived accounts exist so the
  // empty state can say "your accounts are hidden" instead of a misleading
  // "No accounts yet". Gated so the extra fetch only runs in that edge case.
  const activeListIsEmpty =
    !showArchived && !accountsQuery.isLoading && !accountsQuery.isError && accounts.length === 0;
  const archivedProbe = useGetAccounts({ includeArchived: true, enabled: activeListIsEmpty });
  const archivedCount = activeListIsEmpty
    ? (archivedProbe.data?.filter((account) => account.archivedAt).length ?? 0)
    : 0;
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

  const count = accounts.length;
  const meta = accountsQuery.isLoading
    ? 'Loading…'
    : `${count} ${count === 1 ? 'account' : 'accounts'}${showArchived ? ' · incl. archived' : ''}`;

  return (
    <StatementSheet
      masthead={
        <PageMasthead
          title="Accounts"
          meta={meta}
          actions={
            <>
              <label className="flex h-9 cursor-pointer items-center gap-2 text-[12.5px] text-[var(--aurex-text-3)]">
                <Checkbox
                  checked={showArchived}
                  onCheckedChange={(value) => setShowArchived(!!value)}
                  aria-label="Show archived accounts"
                />
                Show archived
              </label>
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
                className="h-9 bg-[var(--aurex-brand)] text-white hover:bg-[var(--aurex-bar)]"
              >
                <Plus className="mr-2 size-3.5" />
                Add account
              </Button>
            </>
          }
        />
      }
    >
      <div className="p-5 sm:p-6">
        {accountsQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full rounded-md bg-black/[0.05]" />
            ))}
          </div>
        ) : accountsQuery.isError && !accountsQuery.data ? (
          <DataError
            className="border-0"
            title="Couldn't load your accounts"
            message="We couldn't reach your accounts. Check your connection and try again."
            onRetry={() => accountsQuery.refetch()}
          />
        ) : accounts.length === 0 ? (
          archivedCount > 0 ? (
            <EmptyState
              icon={Archive}
              title="No active accounts"
              message={`${
                archivedCount === 1
                  ? 'One archived account is'
                  : `${archivedCount} archived accounts are`
              } hidden from this list. Show them to restore one, or add a new account.`}
              action={
                <Button
                  onClick={() => setShowArchived(true)}
                  size="sm"
                  variant="outline"
                  className="h-9 border-[var(--aurex-border)] bg-[var(--aurex-surface)] text-[var(--aurex-text-1)] hover:bg-[var(--aurex-surface-hover)]"
                >
                  <Archive className="mr-2 size-3.5" />
                  Show archived
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Wallet}
              title="No accounts yet"
              message="Add an account by hand, or link a bank to import balances and transactions automatically."
              action={
                <Button
                  onClick={newAccount.onOpen}
                  size="sm"
                  className="h-9 bg-[var(--aurex-brand)] text-white hover:bg-[var(--aurex-bar)]"
                >
                  <Plus className="mr-2 size-3.5" />
                  Add account
                </Button>
              }
            />
          )
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
    </StatementSheet>
  );
}
