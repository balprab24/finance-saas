import { InferResponseType } from 'hono';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { readApiError } from '@/lib/api-errors';
import { client } from '@/lib/hono';

type ResponseType = InferResponseType<typeof client.api.plaid['link-token']['$post'], 200>;

export const useCreateLinkToken = () => {
  return useMutation<ResponseType, Error>({
    mutationFn: async () => {
      const response = await client.api.plaid['link-token'].$post();
      if (!response.ok) {
        throw new Error(await readApiError(response, 'Unable to start bank connection'));
      }
      return await response.json();
    },
    onError: (err) => toast.error(err.message),
  });
};
