import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';

import { client } from '@/lib/hono';
import { convertAmountFromMiliunits } from '@/lib/utils';

export const useGetSummary = () => {
  const params = useSearchParams();
  const from = params.get('from') || '';
  const to = params.get('to') || '';
  const accountId = params.get('accountId') || '';
  const categoryId = params.get('categoryId') || '';

  return useQuery({
    queryKey: ['summary', { from, to, accountId, categoryId }],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const response = await client.api.summary.$get({ query: { from, to, accountId, categoryId } });
      if (!response.ok) throw new Error('Failed to fetch summary');
      const { data } = await response.json();
      return {
        ...data,
        incomeAmount: convertAmountFromMiliunits(data.incomeAmount),
        expensesAmount: convertAmountFromMiliunits(data.expensesAmount),
        remainingAmount: convertAmountFromMiliunits(data.remainingAmount),
        categories: data.categories.map((c) => ({
          ...c,
          value: convertAmountFromMiliunits(c.value),
        })),
        days: data.days.map((d) => ({
          ...d,
          income: convertAmountFromMiliunits(d.income),
          expenses: convertAmountFromMiliunits(d.expenses),
        })),
      };
    },
  });
};
