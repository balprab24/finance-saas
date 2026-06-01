import { useQuery } from '@tanstack/react-query';

import { client } from '@/lib/hono';
import { convertAmountFromMiliunits } from '@/lib/utils';

export const useGetRecurring = () => {
  return useQuery({
    queryKey: ['insights', 'recurring'],
    queryFn: async () => {
      const response = await client.api.insights.recurring.$get();
      if (!response.ok) throw new Error('Failed to load recurring merchants');
      const { data } = await response.json();
      return {
        monthlyTotal: convertAmountFromMiliunits(data.monthlyTotal),
        recurring: data.recurring.map((r) => ({
          ...r,
          typicalAmount: convertAmountFromMiliunits(r.typicalAmount),
          monthlyEquivalent: convertAmountFromMiliunits(r.monthlyEquivalent),
        })),
      };
    },
  });
};
