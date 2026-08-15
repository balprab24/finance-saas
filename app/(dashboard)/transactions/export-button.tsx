'use client';

import { Download } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { useExportTransactions } from '@/features/transactions/api/use-export-transactions';

type Props = {
  disabled?: boolean;
};

// Exports whatever the table currently shows: the same from/to/accountId/
// categoryId params drive both the list query and the download.
export function ExportButton({ disabled }: Props) {
  const params = useSearchParams();
  const exportTransactions = useExportTransactions();

  return (
    <Button
      size="sm"
      variant="outline"
      className="h-9 w-full border-[var(--aurex-border)] bg-[var(--aurex-surface)] text-[var(--aurex-text-1)] hover:bg-[var(--aurex-surface-hover)] lg:w-auto"
      disabled={disabled || exportTransactions.isPending}
      onClick={() =>
        exportTransactions.mutate({
          from: params.get('from') || '',
          to: params.get('to') || '',
          accountId: params.get('accountId') || '',
          categoryId: params.get('categoryId') || '',
        })
      }
    >
      <Download className="mr-2 size-3.5" />
      {exportTransactions.isPending ? 'Exporting…' : 'Export CSV'}
    </Button>
  );
}
