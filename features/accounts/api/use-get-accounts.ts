import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/hono';

type Options = {
  includeArchived?: boolean;
  /** Gate the fetch (react-query `enabled`); the hook itself is always safe to call. */
  enabled?: boolean;
};

export const useGetAccounts = (options?: Options) => {
  const includeArchived = options?.includeArchived ?? false;

  return useQuery({
    enabled: options?.enabled ?? true,
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
