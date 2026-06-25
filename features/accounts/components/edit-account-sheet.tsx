'use client';
import { Loader2 } from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useOpenAccount } from '@/features/accounts/hooks/use-open-account';
import { AccountForm } from '@/features/accounts/components/account-form';
import { useGetAccount } from '@/features/accounts/api/use-get-account';
import { useEditAccount } from '@/features/accounts/api/use-edit-account';
import { useArchiveAccount } from '@/features/accounts/api/use-archive-account';
import { useRestoreAccount } from '@/features/accounts/api/use-restore-account';
import { useConfirm } from '@/hooks/use-confirm';

type FormValues = { name: string };

export function EditAccountSheet() {
  const { isOpen, onClose, id } = useOpenAccount();
  const [ArchiveDialog, confirmArchive] = useConfirm(
    'Archive account?',
    'This hides the account from new transactions and account lists. Existing transactions stay intact.',
  );
  const [RestoreDialog, confirmRestore] = useConfirm(
    'Restore account?',
    'This makes the account available in account lists and new transaction forms again.',
  );

  const accountQuery = useGetAccount(id);
  const editMutation = useEditAccount(id);
  const archiveMutation = useArchiveAccount(id);
  const restoreMutation = useRestoreAccount(id);

  const isPending =
    editMutation.isPending || archiveMutation.isPending || restoreMutation.isPending;
  const isLoading = accountQuery.isLoading;

  const onSubmit = (values: FormValues) => {
    editMutation.mutate(values, { onSuccess: () => onClose() });
  };

  const onArchive = async () => {
    const ok = await confirmArchive();
    if (ok) archiveMutation.mutate(undefined, { onSuccess: () => onClose() });
  };

  const onRestore = async () => {
    const ok = await confirmRestore();
    if (ok) restoreMutation.mutate(undefined, { onSuccess: () => onClose() });
  };

  const defaultValues = accountQuery.data ? { name: accountQuery.data.name } : { name: '' };

  return (
    <>
      <ArchiveDialog />
      <RestoreDialog />
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="space-y-4">
          <SheetHeader>
            <SheetTitle>Edit Account</SheetTitle>
            <SheetDescription>Edit an existing account.</SheetDescription>
          </SheetHeader>
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="size-4 text-muted-foreground animate-spin" />
            </div>
          ) : (
            <AccountForm
              id={id}
              onSubmit={onSubmit}
              disabled={isPending}
              defaultValues={defaultValues}
              archived={!!accountQuery.data?.archivedAt}
              onArchive={onArchive}
              onRestore={onRestore}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
