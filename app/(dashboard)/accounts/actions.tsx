'use client';

import { Archive, ArchiveRestore, Edit, MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useOpenAccount } from '@/features/accounts/hooks/use-open-account';
import { useArchiveAccount } from '@/features/accounts/api/use-archive-account';
import { useRestoreAccount } from '@/features/accounts/api/use-restore-account';
import { useConfirm } from '@/hooks/use-confirm';

export function Actions({ id, archived }: { id: string; archived?: boolean }) {
  const [ArchiveDialog, confirmArchive] = useConfirm(
    'Archive account?',
    'This hides the account from new transactions and account lists. Existing transactions stay intact.',
  );
  const [RestoreDialog, confirmRestore] = useConfirm(
    'Restore account?',
    'This makes the account available in account lists and new transaction forms again.',
  );
  const { onOpen } = useOpenAccount();
  const archiveMutation = useArchiveAccount(id);
  const restoreMutation = useRestoreAccount(id);

  const isPending = archiveMutation.isPending || restoreMutation.isPending;

  const onArchive = async () => {
    const ok = await confirmArchive();
    if (ok) archiveMutation.mutate();
  };

  const onRestore = async () => {
    const ok = await confirmRestore();
    if (ok) restoreMutation.mutate();
  };

  return (
    <>
      <ArchiveDialog />
      <RestoreDialog />
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
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
