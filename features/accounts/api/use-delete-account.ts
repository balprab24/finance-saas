import { InferResponseType } from 'hono';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { readApiError } from '@/lib/api-errors';

import { client } from '@/lib/hono';

type ResponseType = InferResponseType<typeof client.api.accounts[':id']['$delete']>;

export const useDeleteAccount = (id?: string) => {
  const queryClient = useQueryClient();
  return useMutation<ResponseType, Error>({
    mutationFn: async () => {
      const response = await client.api.accounts[':id']['$delete']({ param: { id } });
      if (!response.ok) throw new Error(await readApiError(response, 'Failed to delete account'));
      return await response.json();
    },
    onSuccess: () => {
      toast.success('Account deleted');
      queryClient.invalidateQueries({ queryKey: ['account', { id }] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
    onError: (err) => toast.error(err.message),
  });
};