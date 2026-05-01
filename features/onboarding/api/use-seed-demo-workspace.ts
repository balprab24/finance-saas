import { InferResponseType } from 'hono';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { client } from '@/lib/hono';

type ResponseType = InferResponseType<typeof client.api.onboarding.demo.$post>;

export const useSeedDemoWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation<ResponseType, Error>({
    mutationFn: async () => {
      const response = await client.api.onboarding.demo.$post();
      if (response.status === 409) {
        throw new Error('Demo data can only be loaded into an empty workspace');
      }
      if (!response.ok) throw new Error('Failed to load demo data');
      return await response.json();
    },
    onSuccess: () => {
      toast.success('Demo workspace loaded');
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
    onError: (error) => toast.error(error.message),
  });
};
