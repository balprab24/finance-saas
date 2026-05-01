'use client';

import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/data-table';

import { columns } from './columns';
import { useNewTransaction } from '@/features/transactions/hooks/use-new-transaction';
import { useGetTransactions } from '@/features/transactions/api/use-get-transactions';
import { useBulkDeleteTransactions } from '@/features/transactions/api/use-bulk-delete-transactions';
import { useBulkCreateTransactions } from '@/features/transactions/api/use-bulk-create-transactions';
import { useSelectAccount } from '@/features/accounts/hooks/use-select-account';
import { UploadButton } from './upload-button';
import { ImportCard } from './import-card';

enum VARIANTS {
  LIST = 'LIST',
  IMPORT = 'IMPORT',
}

const INITIAL_IMPORT_RESULTS = {
  data: [] as string[][],
  errors: [] as unknown[],
  meta: {} as object,
};

export default function TransactionsPage() {
  const [AccountDialog, confirm] = useSelectAccount();
  const [variant, setVariant] = useState<VARIANTS>(VARIANTS.LIST);
  const [importResults, setImportResults] = useState(INITIAL_IMPORT_RESULTS);

  const onUpload = (results: typeof INITIAL_IMPORT_RESULTS) => {
    setImportResults(results);
    setVariant(VARIANTS.IMPORT);
  };
  const onCancelImport = () => {
    setImportResults(INITIAL_IMPORT_RESULTS);
    setVariant(VARIANTS.LIST);
  };

  const newTransaction = useNewTransaction();
  const transactionsQuery = useGetTransactions();
  const deleteTransactions = useBulkDeleteTransactions();
  const createTransactions = useBulkCreateTransactions();
  const transactions = transactionsQuery.data || [];

  const isDisabled = transactionsQuery.isLoading || deleteTransactions.isPending;

  const onSubmitImport = async (
    values: { amount: number; date: string; payee: string; notes?: string }[],
  ) => {
    const accountId = await confirm();
    if (!accountId) return toast.error('Please select an account to continue');
    const data = values.map((value) => ({
      ...value,
      accountId: accountId as string,
      date: new Date(value.date),
    }));
    createTransactions.mutate(data, { onSuccess: () => onCancelImport() });
  };

  if (transactionsQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-screen-2xl pb-16 pt-8">
        <div className="aurex-card p-6">
          <Skeleton className="h-8 w-48 bg-white/10" />
          <div className="mt-6 flex h-[500px] w-full items-center justify-center">
            <Loader2 className="size-6 animate-spin text-[var(--aurex-text-3)]" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === VARIANTS.IMPORT) {
    return (
      <>
        <AccountDialog />
        <ImportCard
          data={importResults.data}
          onCancel={onCancelImport}
          onSubmit={onSubmitImport as never}
        />
      </>
    );
  }

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-6 pb-16 pt-8">
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--aurex-text-3)]">
          Transactions
        </span>
        <h1 className="text-[28px] font-semibold tracking-tight text-[var(--aurex-text-1)] lg:text-[34px]">
          Every dollar, accounted for
        </h1>
      </div>
      <div className="aurex-card p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-[18px] font-semibold tracking-tight text-[var(--aurex-text-1)]">
            Transactions history
          </h2>
          <div className="flex flex-col items-stretch gap-2 lg:flex-row lg:items-center">
            <Button
              onClick={newTransaction.onOpen}
              size="sm"
              className="w-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white shadow-[0_8px_24px_rgba(99,102,241,0.32)] hover:from-[#7a7df7] hover:to-[#9b6cf8] lg:w-auto"
            >
              <Plus className="mr-2 size-4" />
              Add new
            </Button>
            <UploadButton onUpload={onUpload} />
          </div>
        </div>
        <div className="mt-4">
          <DataTable
            filterKey="payee"
            columns={columns}
            data={transactions}
            onDelete={(rows) => deleteTransactions.mutate({ ids: rows.map((r) => r.original.id) })}
            disabled={isDisabled}
          />
        </div>
      </div>
    </div>
  );
}
