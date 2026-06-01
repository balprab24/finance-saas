import { InferRequestType, InferResponseType } from 'hono';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { readApiError } from '@/lib/api-errors';

import { client } from '@/lib/hono';

type ResponseType = InferResponseType<typeof client.api.insights.recurring.ignore.$post>;
type RequestType = InferRequestType<typeof client.api.insights.recurring.ignore.$post>['json'];

// The success toast (with an Undo action) is owned by the caller so it can wire
// the un-ignore recovery path; this hook only handles invalidation + errors.
export const useIgnoreRecurring = () => {
  const queryClient = useQueryClient();
  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.insights.recurring.ignore.$post({ json });
      if (!response.ok) throw new Error(await readApiError(response, 'Failed to dismiss merchant'));
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insights', 'recurring'] });
    },
    onError: (err) => toast.error(err.message),
  });
};
