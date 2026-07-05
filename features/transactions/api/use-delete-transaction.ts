import { InferResponseType } from 'hono';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { readApiError } from '@/lib/api-errors';

import { client } from '@/lib/hono';
import { useRestoreTransactions } from './use-restore-transactions';

type ResponseType = InferResponseType<typeof client.api.transactions[':id']['$delete'], 200>;

export const useDeleteTransaction = (id?: string) => {
  const queryClient = useQueryClient();
  const restoreTransactions = useRestoreTransactions();
  return useMutation<ResponseType, Error>({
    mutationFn: async () => {
      const response = await client.api.transactions[':id']['$delete']({ param: { id } });
      if (!response.ok) throw new Error(await readApiError(response, 'Failed to delete transaction'));
      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success('Transaction deleted', {
        duration: 8000,
        action: {
          label: 'Undo',
          onClick: () =>
            restoreTransactions.mutate([
              {
                amount: data.amount,
                payee: data.payee,
                notes: data.notes,
                date: new Date(data.date),
                accountId: data.accountId,
                categoryId: data.categoryId,
              },
            ]),
        },
      });
      queryClient.invalidateQueries({ queryKey: ['transaction', { id }] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
    onError: (err) => toast.error(err.message),
  });
};
