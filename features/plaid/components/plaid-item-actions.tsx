'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw, RotateCw, Unlink } from 'lucide-react';
import { usePlaidLink } from 'react-plaid-link';

import { Button } from '@/components/ui/button';
import { useRemovePlaidItem } from '@/features/plaid/api/use-remove-plaid-item';
import { useSyncPlaidItem } from '@/features/plaid/api/use-sync-plaid-item';
import { useUpdateLinkToken } from '@/features/plaid/api/use-update-link-token';
import { useConfirm } from '@/hooks/use-confirm';

type PlaidItemActionsProps = {
  itemId: string;
  status: string;
};

export function PlaidItemActions({ itemId, status }: PlaidItemActionsProps) {
  const [updateLinkToken, setUpdateLinkToken] = useState<string | null>(null);
  const [RemoveConnectionDialog, confirmRemoveConnection] = useConfirm(
    'Remove bank connection?',
    'This disconnects the bank from Aurex and archives every account linked to it. Imported transactions stay in your history.',
  );
  const syncPlaidItem = useSyncPlaidItem();
  const removePlaidItem = useRemovePlaidItem();
  const updateLinkTokenMutation = useUpdateLinkToken();
  const canReconnect = status === 'error';
  const isPending =
    syncPlaidItem.isPending || removePlaidItem.isPending || updateLinkTokenMutation.isPending;

  const onReconnectSuccess = useCallback(() => {
    syncPlaidItem.mutate(
      { itemId },
      { onSettled: () => setUpdateLinkToken(null) },
    );
  }, [itemId, syncPlaidItem]);

  const { open, ready } = usePlaidLink({
    token: updateLinkToken,
    onSuccess: onReconnectSuccess,
    onExit: () => setUpdateLinkToken(null),
  });

  useEffect(() => {
    if (updateLinkToken && ready) open();
  }, [updateLinkToken, open, ready]);

  const onSync = () => {
    syncPlaidItem.mutate({ itemId });
  };

  const onReconnect = async () => {
    try {
      const response = await updateLinkTokenMutation.mutateAsync({ itemId });
      setUpdateLinkToken(response.data.linkToken);
    } catch {
      // useUpdateLinkToken owns the toast.
    }
  };

  const onRemoveConnection = async () => {
    const ok = await confirmRemoveConnection();
    if (ok) removePlaidItem.mutate({ itemId });
  };

  return (
    <>
      <RemoveConnectionDialog />
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={onSync}
          className="h-8 border-[var(--aurex-border)] bg-[var(--aurex-surface-2)] text-[var(--aurex-text-1)] hover:bg-[var(--aurex-surface-hover)]"
        >
          {syncPlaidItem.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
          Sync
        </Button>
        {canReconnect ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={onReconnect}
            className="h-8 border-[rgba(251,191,36,0.28)] bg-[var(--aurex-warn-soft)] text-[var(--aurex-warn)] hover:bg-[rgba(251,191,36,0.16)]"
          >
            {updateLinkTokenMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RotateCw className="size-3.5" />
            )}
            Reconnect
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={isPending}
          onClick={onRemoveConnection}
          className="h-8"
        >
          <Unlink className="size-3.5" />
          Remove
        </Button>
      </div>
    </>
  );
}
