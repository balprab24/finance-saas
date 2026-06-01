import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';

import { client } from '@/lib/hono';
import { convertAmountFromMiliunits } from '@/lib/utils';

// Reads the active month from the URL (?month=YYYY-MM), defaulting to the current
// month. An explicit `month` arg overrides the URL (used by the dashboard card,
// which always shows the current month regardless of the dashboard date filter).
export const useGetBudgets = (month?: string) => {
  const params = useSearchParams();
  const activeMonth = month ?? params.get('month') ?? format(new Date(), 'yyyy-MM');

  return useQuery({
    queryKey: ['budgets', { month: activeMonth }],
    queryFn: async () => {
      const response = await client.api.budgets.$get({ query: { month: activeMonth } });
      if (!response.ok) throw new Error('Failed to fetch budgets');
      const { data } = await response.json();
      return {
        month: data.month,
        totalBudgeted: convertAmountFromMiliunits(data.totalBudgeted),
        totalSpent: convertAmountFromMiliunits(data.totalSpent),
        totalRemaining: convertAmountFromMiliunits(data.totalRemaining),
        categories: data.categories.map((c) => ({
          ...c,
          budgeted: c.budgeted === null ? null : convertAmountFromMiliunits(c.budgeted),
          spent: convertAmountFromMiliunits(c.spent),
          remaining: c.remaining === null ? null : convertAmountFromMiliunits(c.remaining),
        })),
      };
    },
  });
};
