'use client';

import { useState } from 'react';
import { Plus, ReceiptText } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/data-table';
import { DataError } from '@/components/data-error';
import { EmptyState } from '@/components/empty-state';
import { PageMasthead } from '@/components/page-masthead';
import { StatementSheet } from '@/components/statement-sheet';

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

  if (variant === VARIANTS.IMPORT) {
    return (
      <>
        <AccountDialog />
        <ImportCard
          data={importResults.data}
          onCancel={onCancelImport}
          onSubmit={onSubmitImport}
        />
      </>
    );
  }

  const count = transactions.length;

  return (
    <StatementSheet
      masthead={
        <PageMasthead
          title="Transactions"
          meta={
            transactionsQuery.isLoading
              ? 'Loading…'
              : `${count} ${count === 1 ? 'transaction' : 'transactions'}`
          }
          actions={
            <>
              <Button
                onClick={newTransaction.onOpen}
                size="sm"
                className="h-9 w-full bg-[var(--aurex-brand)] text-white hover:bg-[#2b2f36] sm:w-auto"
              >
                <Plus className="mr-2 size-3.5" />
                Add transaction
              </Button>
              <UploadButton onUpload={onUpload} />
            </>
          }
        />
      }
    >
      <div className="p-5 sm:p-6">
        {transactionsQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full rounded-md bg-black/[0.05]" />
            ))}
          </div>
        ) : transactionsQuery.isError && !transactionsQuery.data ? (
          <DataError
            className="border-0"
            title="Couldn't load your transactions"
            message="We couldn't reach your transaction history. Check your connection and try again."
            onRetry={() => transactionsQuery.refetch()}
          />
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="No transactions yet"
            message="Add a transaction by hand or import a bank CSV to start reconciling your activity."
            action={
              <Button
                onClick={newTransaction.onOpen}
                size="sm"
                className="h-9 bg-[var(--aurex-brand)] text-white hover:bg-[#2b2f36]"
              >
                <Plus className="mr-2 size-3.5" />
                Add transaction
              </Button>
            }
          />
        ) : (
          <DataTable
            filterKey="payee"
            columns={columns}
            data={transactions}
            onDelete={(rows) =>
              deleteTransactions.mutate({ ids: rows.map((r) => r.original.id) })
            }
            disabled={isDisabled}
          />
        )}
      </div>
    </StatementSheet>
  );
}
