import { InferRequestType, InferResponseType } from 'hono';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { readApiError } from '@/lib/api-errors';

import { client } from '@/lib/hono';

type ResponseType = InferResponseType<typeof client.api.categories['bulk-delete']['$post']>;
type RequestType = InferRequestType<typeof client.api.categories['bulk-delete']['$post']>['json'];

export const useBulkDeleteCategories = () => {
  const queryClient = useQueryClient();
  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.categories['bulk-delete']['$post']({ json });
      if (!response.ok) throw new Error(await readApiError(response, 'Failed to delete categories'));
      return await response.json();
    },
    onSuccess: () => {
      toast.success('Categories deleted');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
    onError: (err) => toast.error(err.message),
  });
};