import { InferResponseType } from 'hono';
import { useQuery } from '@tanstack/react-query';

import { client } from '@/lib/hono';

type ResponseType = InferResponseType<typeof client.api.plaid.items.$get, 200>;

export const useGetPlaidItems = () => {
  return useQuery<ResponseType['data']>({
    queryKey: ['plaid-items'],
    queryFn: async () => {
      const response = await client.api.plaid.items.$get();
      if (!response.ok) throw new Error('Failed to fetch linked banks');
      const { data } = await response.json();
      return data;
    },
  });
};
