import { useQuery } from '@tanstack/react-query';

import { client } from '@/lib/hono';

export const useGetOnboardingStatus = () => {
  return useQuery({
    queryKey: ['onboarding-status'],
    queryFn: async () => {
      const response = await client.api.onboarding.status.$get();
      if (!response.ok) throw new Error('Failed to fetch onboarding status');
      return await response.json();
    },
  });
};
