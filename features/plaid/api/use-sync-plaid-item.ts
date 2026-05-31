import { InferResponseType } from 'hono';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { readApiError } from '@/lib/api-errors';
import { client } from '@/lib/hono';

type ResponseType = InferResponseType<
  typeof client.api.plaid.items[':itemId']['sync']['$post']
>;

export const useSyncPlaidItem = () => {
  const queryClient = useQueryClient();

  return useMutation<ResponseType, Error, { itemId: string }>({
    mutationFn: async ({ itemId }) => {
      const response = await client.api.plaid.items[':itemId']['sync'].$post({
        param: { itemId },
      });
      if (!response.ok) {
        throw new Error(await readApiError(response, 'Unable to refresh bank transactions'));
      }
      return await response.json();
    },
    onSuccess: () => {
      toast.success('Bank sync queued');
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['plaid-items'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
    },
    onError: (err) => toast.error(err.message),
  });
};
