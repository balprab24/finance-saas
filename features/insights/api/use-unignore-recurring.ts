import { InferRequestType, InferResponseType } from 'hono';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { readApiError } from '@/lib/api-errors';

import { client } from '@/lib/hono';

type ResponseType = InferResponseType<typeof client.api.insights.recurring.ignore.$delete>;
type RequestType = InferRequestType<typeof client.api.insights.recurring.ignore.$delete>['json'];

export const useUnignoreRecurring = () => {
  const queryClient = useQueryClient();
  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.insights.recurring.ignore.$delete({ json });
      if (!response.ok) throw new Error(await readApiError(response, 'Failed to restore merchant'));
      return await response.json();
    },
    onSuccess: () => {
      toast.success('Restored to recurring');
      queryClient.invalidateQueries({ queryKey: ['insights', 'recurring'] });
    },
    onError: (err) => toast.error(err.message),
  });
};
