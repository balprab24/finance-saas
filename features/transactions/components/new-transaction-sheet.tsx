'use client';

import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { insertTransactionSchema } from '@/db/schema';
import { useNewTransaction } from '@/features/transactions/hooks/use-new-transaction';
import { TransactionForm } from '@/features/transactions/components/transaction-form';
import { useCreateTransaction } from '@/features/transactions/api/use-create-transaction';

import { useGetAccounts } from '@/features/accounts/api/use-get-accounts';
import { useCreateAccount } from '@/features/accounts/api/use-create-account';
import { useGetCategories } from '@/features/categories/api/use-get-categories';
import { useCreateCategory } from '@/features/categories/api/use-create-category';

type FormValues = z.input<ReturnType<typeof insertTransactionSchema.omit<{ id: true }>>>;

export function NewTransactionSheet() {
  const { isOpen, onClose } = useNewTransaction();

  const createTransaction = useCreateTransaction();
  const accountQuery = useGetAccounts();
  const accountMutation = useCreateAccount();
  const categoryQuery = useGetCategories();
  const categoryMutation = useCreateCategory();

  const onCreateAccount = (name: string) => accountMutation.mutate({ name });
  const onCreateCategory = (name: string) => categoryMutation.mutate({ name });

  const accountOptions = (accountQuery.data ?? []).map((a) => ({ label: a.name, value: a.id }));
  const categoryOptions = (categoryQuery.data ?? []).map((c) => ({ label: c.name, value: c.id }));

  const isPending =
    createTransaction.isPending || accountMutation.isPending || categoryMutation.isPending;
  const isLoading = accountQuery.isLoading || categoryQuery.isLoading;

  const onSubmit = (values: FormValues) => {
    createTransaction.mutate(values, { onSuccess: () => onClose() });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="space-y-4">
        <SheetHeader>
          <SheetTitle>New Transaction</SheetTitle>
          <SheetDescription>Add a new transaction.</SheetDescription>
        </SheetHeader>
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="size-4 text-muted-foreground animate-spin" />
          </div>
        ) : (
          <TransactionForm
            onSubmit={onSubmit}
            disabled={isPending}
            categoryOptions={categoryOptions}
            onCreateCategory={onCreateCategory}
            accountOptions={accountOptions}
            onCreateAccount={onCreateAccount}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
