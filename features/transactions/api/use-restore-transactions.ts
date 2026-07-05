import { InferRequestType, InferResponseType } from 'hono';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { readApiError } from '@/lib/api-errors';

import { client } from '@/lib/hono';

type ResponseType = InferResponseType<typeof client.api.transactions['bulk-create']['$post'], 200>;
type RequestType = InferRequestType<typeof client.api.transactions['bulk-create']['$post']>['json'];

// Re-creates rows handed back by a delete so the "Undo" toast action can
// restore them. Restored transactions get fresh ids, which is acceptable.
// Restoring onto a since-archived account or deleted category fails the
// server's ownership checks; that error surfaces via the error toast.
export const useRestoreTransactions = () => {
  const queryClient = useQueryClient();
  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.transactions['bulk-create']['$post']({ json });
      if (!response.ok) throw new Error(await readApiError(response, 'Failed to restore transactions'));
      return await response.json();
    },
    onSuccess: (data) => {
      toast.success(data.data.length === 1 ? 'Transaction restored' : 'Transactions restored');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
    onError: (err) => toast.error(err.message),
  });
};
