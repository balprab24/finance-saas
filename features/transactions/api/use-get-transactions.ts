import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';

import { client } from '@/lib/hono';
import { convertAmountFromMiliunits } from '@/lib/utils';

export const useGetTransactions = () => {
  const params = useSearchParams();
  const from = params.get('from') || '';
  const to = params.get('to') || '';
  const accountId = params.get('accountId') || '';
  const categoryId = params.get('categoryId') || '';

  return useQuery({
    queryKey: ['transactions', { from, to, accountId, categoryId }],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const response = await client.api.transactions.$get({
        query: { from, to, accountId, categoryId },
      });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const { data } = await response.json();
      return data.map((t) => ({ ...t, amount: convertAmountFromMiliunits(t.amount) }));
    },
  });
};
