import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';

import { client } from '@/lib/hono';
import { convertAmountFromMiliunits } from '@/lib/utils';

export const useGetUnusual = (month?: string) => {
  const params = useSearchParams();
  const activeMonth = month ?? params.get('month') ?? format(new Date(), 'yyyy-MM');

  return useQuery({
    queryKey: ['insights', 'unusual', { month: activeMonth }],
    queryFn: async () => {
      const response = await client.api.insights.unusual.$get({ query: { month: activeMonth } });
      if (!response.ok) throw new Error('Failed to load spending alerts');
      const { data } = await response.json();
      return data.unusual.map((u) => ({
        ...u,
        current: convertAmountFromMiliunits(u.current),
        trailingAvg: convertAmountFromMiliunits(u.trailingAvg),
      }));
    },
  });
};
