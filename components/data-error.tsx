'use client';

import { RefreshCw, TriangleAlert } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type Props = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
};

// Shared inline error state for dashboard data regions. Matches the house
// empty-state idiom (dashed surface + icon chip + text-3 copy) but adds a retry.
// The icon is intentionally neutral (text-3), never rose: a failed fetch is a
// load problem, not a financial loss, so it must not borrow the expense color.
export function DataError({
  title = "Couldn't load this",
  message = 'Something went wrong while fetching. Check your connection and try again.',
  onRetry,
  className,
}: Props) {
  return (
    <div
      role="alert"
      className={cn(
        'flex w-full flex-col items-center justify-center gap-3 rounded-md border border-dashed border-[var(--aurex-border)] bg-[var(--aurex-surface)] p-6 text-center',
        className,
      )}
    >
      <div className="rounded-full bg-[var(--aurex-surface-hover)] p-2.5">
        <TriangleAlert className="size-5 text-[var(--aurex-text-3)]" />
      </div>
      <div className="space-y-1">
        <p className="text-[14px] font-medium text-[var(--aurex-text-1)]">{title}</p>
        <p className="mx-auto max-w-sm text-[12.5px] text-[var(--aurex-text-3)]">{message}</p>
      </div>
      {onRetry ? (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-1 border-[var(--aurex-border)] bg-[var(--aurex-surface)] text-[var(--aurex-text-1)] hover:bg-[var(--aurex-surface-hover)]"
        >
          <RefreshCw className="mr-1.5 size-3.5" />
          Try again
        </Button>
      ) : null}
    </div>
  );
}
