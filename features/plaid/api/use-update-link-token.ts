import { InferResponseType } from 'hono';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { readApiError } from '@/lib/api-errors';
import { client } from '@/lib/hono';

type ResponseType = InferResponseType<
  typeof client.api.plaid.items[':itemId']['update-link-token']['$post'],
  200
>;

export const useUpdateLinkToken = () => {
  return useMutation<ResponseType, Error, { itemId: string }>({
    mutationFn: async ({ itemId }) => {
      const response = await client.api.plaid.items[':itemId']['update-link-token'].$post({
        param: { itemId },
      });
      if (!response.ok) {
        throw new Error(await readApiError(response, 'Unable to start bank reconnection'));
      }
      return (await response.json()) as ResponseType;
    },
    onError: (err) => toast.error(err.message),
  });
};
