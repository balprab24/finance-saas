'use client';

import { format } from 'date-fns';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';

import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGetRecurring } from '@/features/insights/api/use-get-recurring';
import { useIgnoreRecurring } from '@/features/insights/api/use-ignore-recurring';
import { useUnignoreRecurring } from '@/features/insights/api/use-unignore-recurring';

const CADENCE_LABEL: Record<string, string> = {
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

export function RecurringList() {
  const recurringQuery = useGetRecurring();
  const ignore = useIgnoreRecurring();
  const unignore = useUnignoreRecurring();

  const onDismiss = (merchantKey: string, name: string) => {
    ignore.mutate(
      { merchantKey },
      {
        onSuccess: () =>
          toast.success(`Dismissed ${name}`, {
            action: { label: 'Undo', onClick: () => unignore.mutate({ merchantKey }) },
          }),
      },
    );
  };

  if (recurringQuery.isLoading) {
    return (
      <div className="flex h-[180px] items-center justify-center">
        <Loader2 className="size-5 animate-spin text-[var(--aurex-text-3)]" />
      </div>
    );
  }

  const items = recurringQuery.data?.recurring ?? [];

  if (items.length === 0) {
    return (
      <div className="flex h-[140px] items-center justify-center text-center text-[13px] text-[var(--aurex-text-3)]">
        No recurring merchants detected yet. They appear once a merchant has at least
        three regularly spaced charges.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-[var(--aurex-border)]">
      {items.map((item) => (
        <li key={item.merchantKey} className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-[14px] font-medium text-[var(--aurex-text-1)]">
                {item.displayName}
              </span>
              <Badge className="shrink-0 border-0 bg-[var(--aurex-surface)] text-[11px] text-[var(--aurex-text-3)]">
                {CADENCE_LABEL[item.cadence] ?? item.cadence}
              </Badge>
            </div>
            <div className="mt-0.5 text-[12px] text-[var(--aurex-text-3)]">
              Next ≈ {format(new Date(item.nextExpectedDate), 'MMM d')} · {item.occurrences} charges
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="tabular-nums text-[14px] font-semibold text-[var(--aurex-text-1)]">
                {formatCurrency(item.typicalAmount)}
              </div>
              <div className="text-[11px] text-[var(--aurex-text-4)]">
                ≈ {formatCurrency(item.monthlyEquivalent)}/mo
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              disabled={ignore.isPending}
              onClick={() => onDismiss(item.merchantKey, item.displayName)}
              className="size-8 p-0 text-[var(--aurex-text-3)] hover:bg-[var(--aurex-surface-hover)] hover:text-[#c0392b]"
              aria-label={`Dismiss ${item.displayName}`}
            >
              <X className="size-4" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
