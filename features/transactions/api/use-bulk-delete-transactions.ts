import { InferRequestType, InferResponseType } from 'hono';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { readApiError } from '@/lib/api-errors';

import { client } from '@/lib/hono';
import { useRestoreTransactions } from './use-restore-transactions';

type ResponseType = InferResponseType<typeof client.api.transactions['bulk-delete']['$post'], 200>;
type RequestType = InferRequestType<typeof client.api.transactions['bulk-delete']['$post']>['json'];

export const useBulkDeleteTransactions = () => {
  const queryClient = useQueryClient();
  const restoreTransactions = useRestoreTransactions();
  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.transactions['bulk-delete']['$post']({ json });
      if (!response.ok) throw new Error(await readApiError(response, 'Failed to delete transactions'));
      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success(
        data.length === 1 ? 'Transaction deleted' : `${data.length} transactions deleted`,
        {
          duration: 8000,
          action: {
            label: 'Undo',
            onClick: () =>
              restoreTransactions.mutate(
                data.map((row) => ({
                  amount: row.amount,
                  payee: row.payee,
                  notes: row.notes,
                  date: new Date(row.date),
                  accountId: row.accountId,
                  categoryId: row.categoryId,
                })),
              ),
          },
        },
      );
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
    onError: (err) => toast.error(err.message),
  });
};
