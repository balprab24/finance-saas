import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { client } from '@/lib/hono';
import { readApiError } from '@/lib/api-errors';

type ExportQuery = { from: string; to: string; accountId: string; categoryId: string };

const FALLBACK_FILENAME = 'aurex-transactions.csv';

function filenameFromDisposition(header: string | null): string {
  const match = header?.match(/filename="([^"]+)"/);
  return match?.[1] ?? FALLBACK_FILENAME;
}

// A blob fetch rather than a plain <a href>: the RPC client sends the Clerk
// session cookie same-origin, and 401/429/500 surface through readApiError as
// toasts instead of a raw JSON body opening in a tab.
export const useExportTransactions = () => {
  return useMutation<{ truncated: boolean }, Error, ExportQuery>({
    mutationFn: async (query) => {
      const response = await client.api.transactions.export.$get({ query });
      if (!response.ok) {
        throw new Error(await readApiError(response, 'Failed to export transactions'));
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filenameFromDisposition(response.headers.get('content-disposition'));
      anchor.click();
      URL.revokeObjectURL(url);

      return { truncated: response.headers.get('x-export-truncated') === 'true' };
    },
    onSuccess: ({ truncated }) => {
      if (truncated) {
        toast.info('Export capped at 10,000 rows. Narrow the date range to get the rest.');
      }
    },
    onError: (err) => toast.error(err.message),
  });
};
