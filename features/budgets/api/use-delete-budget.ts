import { InferResponseType } from 'hono';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { readApiError } from '@/lib/api-errors';

import { client } from '@/lib/hono';

type ResponseType = InferResponseType<typeof client.api.budgets[':id']['$delete']>;

export const useDeleteBudget = () => {
  const queryClient = useQueryClient();
  return useMutation<ResponseType, Error, { id: string }>({
    mutationFn: async ({ id }) => {
      const response = await client.api.budgets[':id']['$delete']({ param: { id } });
      if (!response.ok) throw new Error(await readApiError(response, 'Failed to clear budget'));
      return await response.json();
    },
    onSuccess: () => {
      toast.success('Budget cleared');
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
    onError: (err) => toast.error(err.message),
  });
};
