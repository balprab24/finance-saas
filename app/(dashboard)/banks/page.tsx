'use client';

import { formatDistanceToNow } from 'date-fns';
import { Building2, Loader2 } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { PlaidLinkButton } from '@/features/plaid/components/plaid-link-button';
import { PlaidItemActions } from '@/features/plaid/components/plaid-item-actions';
import { useGetPlaidItems } from '@/features/plaid/api/use-get-plaid-items';

function relativeDate(value: Date | string | null) {
  if (!value) return 'Never';
  return `${formatDistanceToNow(new Date(value), { addSuffix: true })}`;
}

function statusClass(status: string) {
  if (status === 'active') {
    return 'border-[rgba(34,197,94,0.24)] bg-[rgba(34,197,94,0.08)] text-[#86efac]';
  }
  if (status === 'error') {
    return 'border-[rgba(251,191,36,0.24)] bg-[var(--aurex-warn-soft)] text-[var(--aurex-warn)]';
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

  if (itemsQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-screen-2xl pb-16 pt-6">
        <div className="aurex-card p-5">
          <Skeleton className="h-6 w-40 bg-white/8" />
          <div className="mt-5 flex h-[360px] w-full items-center justify-center">
            <Loader2 className="size-5 animate-spin text-[var(--aurex-text-3)]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-5 pb-16 pt-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--aurex-text-3)]">
            Banks
          </span>
          <h1 className="font-display text-[26px] font-medium tracking-[-0.01em] text-[var(--aurex-text-1)] lg:text-[30px]">
            Linked bank connections
          </h1>
        </div>
        <PlaidLinkButton disabled={itemsQuery.isFetching} />
      </div>

      <div className="aurex-card p-0">
        {items.length === 0 ? (
          <div className="flex min-h-[340px] flex-col items-center justify-center gap-4 px-6 text-center">
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
      </div>
    </div>
  );
}
