import { InferRequestType, InferResponseType } from 'hono';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { readApiError } from '@/lib/api-errors';
import { client } from '@/lib/hono';

type ResponseType = InferResponseType<
  typeof client.api.plaid['exchange-public-token']['$post'],
  200
>;
type RequestType = InferRequestType<
  typeof client.api.plaid['exchange-public-token']['$post']
>['json'];

export const useExchangePublicToken = () => {
  const queryClient = useQueryClient();

  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.plaid['exchange-public-token'].$post({ json });
      if (!response.ok) {
        throw new Error(await readApiError(response, 'Unable to connect this bank'));
      }
      return (await response.json()) as ResponseType;
    },
    onSuccess: (result) => {
      // The bank links even if the first sync fails; surface that distinctly so
      // the user knows to retry from the connection's repair state.
      if (result.data.status === 'error') {
        toast.error('Bank linked, but its first sync needs attention.');
      } else {
        toast.success('Bank connected');
      }
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['plaid-items'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
    },
    onError: (err) => toast.error(err.message),
  });
};
