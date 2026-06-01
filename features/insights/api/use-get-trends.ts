import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';

import { client } from '@/lib/hono';
import { convertAmountFromMiliunits } from '@/lib/utils';

export const useGetTrends = (month?: string) => {
  const params = useSearchParams();
  const activeMonth = month ?? params.get('month') ?? format(new Date(), 'yyyy-MM');

  return useQuery({
    queryKey: ['insights', 'trends', { month: activeMonth }],
    queryFn: async () => {
      const response = await client.api.insights.trends.$get({ query: { month: activeMonth } });
      if (!response.ok) throw new Error('Failed to load category trends');
      const { data } = await response.json();
      return data.trends.map((t) => ({
        ...t,
        current: convertAmountFromMiliunits(t.current),
        previous: convertAmountFromMiliunits(t.previous),
        change: convertAmountFromMiliunits(t.change),
      }));
    },
  });
};
