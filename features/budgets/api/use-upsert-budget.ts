import { InferRequestType, InferResponseType } from 'hono';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { readApiError } from '@/lib/api-errors';

import { client } from '@/lib/hono';

type ResponseType = InferResponseType<typeof client.api.budgets.$post>;
type RequestType = InferRequestType<typeof client.api.budgets.$post>['json'];

export const useUpsertBudget = () => {
  const queryClient = useQueryClient();
  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.budgets.$post({ json });
      if (!response.ok) throw new Error(await readApiError(response, 'Failed to save budget'));
      return await response.json();
    },
    onSuccess: () => {
      toast.success('Budget saved');
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
    onError: (err) => toast.error(err.message),
  });
};
