'use client';

import { Archive, ArchiveRestore, Edit, MoreHorizontal, Unlink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useOpenAccount } from '@/features/accounts/hooks/use-open-account';
import { useArchiveAccount } from '@/features/accounts/api/use-archive-account';
import { useRestoreAccount } from '@/features/accounts/api/use-restore-account';
import { useRemovePlaidItem } from '@/features/plaid/api/use-remove-plaid-item';
import { useConfirm } from '@/hooks/use-confirm';

type ActionsProps = {
  id: string;
  archived?: boolean;
  plaidItemId?: string | null;
  plaidStatus?: string | null;
};

export function Actions({ id, archived, plaidItemId, plaidStatus }: ActionsProps) {
  const [ArchiveDialog, confirmArchive] = useConfirm(
    'Archive account?',
    'This hides the account from new transactions and account lists. Existing transactions stay intact.',
  );
  const [RestoreDialog, confirmRestore] = useConfirm(
    'Restore account?',
    'This makes the account available in account lists and new transaction forms again.',
  );
  const [RemoveConnectionDialog, confirmRemoveConnection] = useConfirm(
    'Remove bank connection?',
    'This disconnects the bank from Aurex and archives every account linked to it. Imported transactions stay in your history, and you can reconnect the bank later.',
  );
  const { onOpen } = useOpenAccount();
  const archiveMutation = useArchiveAccount(id);
  const restoreMutation = useRestoreAccount(id);
  const removePlaidItem = useRemovePlaidItem();

  // A connection can be managed while it is active or in an error/repair state,
  // but not once it has already been removed.
  const canRemoveConnection = !!plaidItemId && plaidStatus !== 'removed';

  const isPending =
    archiveMutation.isPending || restoreMutation.isPending || removePlaidItem.isPending;

  const onArchive = async () => {
    const ok = await confirmArchive();
    if (ok) archiveMutation.mutate();
  };

  const onRestore = async () => {
    const ok = await confirmRestore();
    if (ok) restoreMutation.mutate();
  };

  const onRemoveConnection = async () => {
    if (!plaidItemId) return;
    const ok = await confirmRemoveConnection();
    if (ok) removePlaidItem.mutate({ itemId: plaidItemId });
  };

  return (
    <>
      <ArchiveDialog />
      <RestoreDialog />
      <RemoveConnectionDialog />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="size-8 p-0">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled={isPending} onClick={() => onOpen(id)}>
            <Edit className="size-4 mr-2" />
            Edit
          </DropdownMenuItem>
          {archived ? (
            <DropdownMenuItem disabled={isPending} onClick={onRestore}>
              <ArchiveRestore className="size-4 mr-2" />
              Restore
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem disabled={isPending} onClick={onArchive}>
              <Archive className="size-4 mr-2" />
              Archive
            </DropdownMenuItem>
          )}
          {canRemoveConnection ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={isPending}
                onClick={onRemoveConnection}
              >
                <Unlink className="size-4 mr-2" />
                Remove bank connection
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
