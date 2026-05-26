import { InferRequestType, InferResponseType } from 'hono';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { readApiError } from '@/lib/api-errors';

import { client } from '@/lib/hono';

type ResponseType = InferResponseType<typeof client.api.transactions.$post>;
type RequestType = InferRequestType<typeof client.api.transactions.$post>['json'];

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.transactions.$post({ json });
      if (!response.ok) throw new Error(await readApiError(response, 'Failed to create transaction'));
      return await response.json();
    },
    onSuccess: () => {
      toast.success('Transaction created');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
    onError: (err) => toast.error(err.message),
  });
};
