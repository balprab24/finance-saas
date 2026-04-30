'use client';

import * as React from 'react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select } from '@/components/select';

import { useGetAccounts } from '@/features/accounts/api/use-get-accounts';
import { useCreateAccount } from '@/features/accounts/api/use-create-account';

export const useSelectAccount = (): [
  () => React.JSX.Element,
  () => Promise<string | undefined>,
] => {
  const accountQuery = useGetAccounts();
  const accountMutation = useCreateAccount();
  const onCreateAccount = (name: string) => accountMutation.mutate({ name });
  const accountOptions = (accountQuery.data ?? []).map((a) => ({ label: a.name, value: a.id }));

  const [promise, setPromise] = useState<{ resolve: (value: string | undefined) => void } | null>(null);
  const [selectValue, setSelectValue] = useState<string | undefined>(undefined);

  const confirm = () => {
    setSelectValue(undefined);
    return new Promise<string | undefined>((resolve) => setPromise({ resolve }));
  };

  const handleClose = () => {
    setPromise(null);
    setSelectValue(undefined);
  };
  const handleConfirm = () => {
    promise?.resolve(selectValue);
    handleClose();
  };
  const handleCancel = () => {
    promise?.resolve(undefined);
    handleClose();
  };

  const ConfirmationDialog = () => (
    <Dialog open={promise !== null} onOpenChange={(open) => { if (!open) handleCancel(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Account</DialogTitle>
          <DialogDescription>Please select an account to continue.</DialogDescription>
        </DialogHeader>
        <Select
          placeholder="Select an account"
          options={accountOptions}
          onCreate={onCreateAccount}
          value={selectValue}
          onChange={(value) => setSelectValue(value)}
          disabled={accountQuery.isLoading || accountMutation.isPending}
        />
        <DialogFooter className="pt-2">
          <Button onClick={handleCancel} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectValue}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return [ConfirmationDialog, confirm];
};
