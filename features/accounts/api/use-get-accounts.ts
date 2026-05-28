import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/hono';

type Options = {
  includeArchived?: boolean;
};

export const useGetAccounts = (options?: Options) => {
  const includeArchived = options?.includeArchived ?? false;

  return useQuery({
    queryKey: ['accounts', { includeArchived }],
    queryFn: async () => {
      const response = await client.api.accounts.$get(
        includeArchived ? { query: { includeArchived: 'true' } } : {},
      );
      if (!response.ok) throw new Error('Failed to fetch accounts');
      const { data } = await response.json();
      return data;
    },
  });
};
