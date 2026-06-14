'use client';

import { formatDistanceToNow } from 'date-fns';
import { Building2 } from 'lucide-react';

import { PageMasthead } from '@/components/page-masthead';
import { StatementSheet } from '@/components/statement-sheet';
import { DataError } from '@/components/data-error';
import { Skeleton } from '@/components/ui/skeleton';
import { PlaidLinkButton } from '@/features/plaid/components/plaid-link-button';
import { PlaidItemActions } from '@/features/plaid/components/plaid-item-actions';
import { useGetPlaidItems } from '@/features/plaid/api/use-get-plaid-items';

function relativeDate(value: Date | string | null) {
  if (!value) return 'Never';
  return `${formatDistanceToNow(new Date(value), { addSuffix: true })}`;
}

// Light Counter status pills: chroma only carries meaning — income green for a
// healthy connection, warn amber for errors, neutral graphite otherwise. (Was a
// dark-theme leftover that rendered near-invisible mint on white.)
function statusClass(status: string) {
  if (status === 'active') {
    return 'border-[rgba(17,122,75,0.3)] bg-[var(--aurex-income-soft)] text-[var(--aurex-income)]';
  }
  if (status === 'error') {
    return 'border-[rgba(180,83,9,0.3)] bg-[var(--aurex-warn-soft)] text-[var(--aurex-warn)]';
  }
  return 'border-[var(--aurex-border)] bg-[var(--aurex-surface)] text-[var(--aurex-text-3)]';
}

function jobLabel(status?: string | null) {
  if (!status) return 'Idle';
  if (status === 'queued') return 'Queued';
  if (status === 'running') return 'Running';
  if (status === 'succeeded') return 'Succeeded';
  if (status === 'failed') return 'Failed';
  return status;
}

export default function BanksPage() {
  const itemsQuery = useGetPlaidItems();
  const items = itemsQuery.data || [];

  const meta = itemsQuery.isLoading
    ? 'Loading…'
    : `${items.length} ${items.length === 1 ? 'connection' : 'connections'}`;
  const masthead = (
    <PageMasthead
      title="Banks"
      meta={meta}
      actions={<PlaidLinkButton disabled={itemsQuery.isFetching} />}
    />
  );

  if (itemsQuery.isLoading) {
    return (
      <StatementSheet masthead={masthead}>
        <div className="space-y-3 p-5 sm:p-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-md bg-black/[0.05]" />
          ))}
        </div>
      </StatementSheet>
    );
  }

  // A failed fetch must not collapse into "No linked banks": a user with linked
  // banks would be nudged to redundantly re-link an account that is actually fine.
  if (itemsQuery.isError && !itemsQuery.data) {
    return (
      <StatementSheet masthead={masthead}>
        <DataError
          className="min-h-[340px] border-0"
          title="Couldn't load your linked banks"
          message="We couldn't reach your bank connections. Check your connection and try again — your linked banks are safe."
          onRetry={() => itemsQuery.refetch()}
        />
      </StatementSheet>
    );
  }

  return (
    <StatementSheet masthead={masthead}>
      {items.length === 0 ? (
        <div className="flex min-h-[340px] flex-col items-center justify-center gap-4 px-6 py-10 text-center">
          <div className="flex size-11 items-center justify-center rounded-lg border border-[var(--aurex-border)] bg-[var(--aurex-surface-2)] text-[var(--aurex-text-2)]">
            <Building2 className="size-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-[15px] font-semibold text-[var(--aurex-text-1)]">
              No linked banks
            </h2>
            <p className="max-w-sm text-[13px] text-[var(--aurex-text-3)]">
              Connect a bank to sync accounts and transactions through Plaid.
            </p>
          </div>
          <PlaidLinkButton disabled={false} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
              <thead className="border-b border-[var(--aurex-border)] text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--aurex-text-3)]">
                <tr>
                  <th className="px-5 py-3">Connection</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Accounts</th>
                  <th className="px-5 py-3">Last sync</th>
                  <th className="px-5 py-3">Job</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--aurex-border)]">
                {items.map((item) => (
                  <tr key={item.id} className="align-middle">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg border border-[var(--aurex-border)] bg-[var(--aurex-surface-2)] text-[var(--aurex-text-2)]">
                          <Building2 className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-[14px] font-medium text-[var(--aurex-text-1)]">
                            {item.institutionName || 'Linked bank'}
                          </div>
                          {item.errorMessage ? (
                            <div className="mt-1 max-w-[320px] truncate text-[12px] text-[var(--aurex-warn)]">
                              {item.errorMessage}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded border px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.08em] ${statusClass(item.status)}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[13px] text-[var(--aurex-text-2)]">
                      {item.accountCount}
                      {item.archivedAccountCount > 0 ? (
                        <span className="text-[var(--aurex-text-3)]">
                          {' '}
                          / {item.archivedAccountCount} archived
                        </span>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 text-[13px] text-[var(--aurex-text-2)]">
                      {relativeDate(item.lastSyncedAt)}
                    </td>
                    <td className="px-5 py-4 text-[13px] text-[var(--aurex-text-2)]">
                      <div>{jobLabel(item.latestSyncJob?.status)}</div>
                      {item.latestSyncJob?.lastError ? (
                        <div className="mt-1 max-w-[260px] truncate text-[12px] text-[var(--aurex-warn)]">
                          {item.latestSyncJob.lastError}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-5 py-4">
                      <PlaidItemActions itemId={item.id} status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
          </table>
        </div>
      )}
    </StatementSheet>
  );
}
