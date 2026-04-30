import { InferRequestType, InferResponseType } from 'hono';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { client } from '@/lib/hono';

type ResponseType = InferResponseType<typeof client.api.accounts['bulk-delete']['$post']>;
type RequestType = InferRequestType<typeof client.api.accounts['bulk-delete']['$post']>['json'];

export const useBulkDeleteAccounts = () => {
  const queryClient = useQueryClient();
  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.accounts['bulk-delete']['$post']({ json });
      if (!response.ok) throw new Error('Failed to delete accounts');
      return await response.json();
    },
    onSuccess: () => {
      toast.success('Accounts deleted');
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
    onError: () => toast.error('Failed to delete accounts'),
  });
};