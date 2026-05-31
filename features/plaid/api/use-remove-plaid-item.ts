import { InferResponseType } from 'hono';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { readApiError } from '@/lib/api-errors';
import { client } from '@/lib/hono';

type ResponseType = InferResponseType<typeof client.api.plaid.items[':itemId']['$delete']>;

export const useRemovePlaidItem = () => {
  const queryClient = useQueryClient();

  return useMutation<ResponseType, Error, { itemId: string }>({
    mutationFn: async ({ itemId }) => {
      const response = await client.api.plaid.items[':itemId'].$delete({
        param: { itemId },
      });
      if (!response.ok) {
        throw new Error(await readApiError(response, 'Unable to remove bank connection'));
      }
      return await response.json();
    },
    onSuccess: () => {
      toast.success('Bank connection removed');
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
    },
    onError: (err) => toast.error(err.message),
  });
};
