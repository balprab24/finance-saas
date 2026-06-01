'use client';

import qs from 'query-string';
import { addMonths, format, parse, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';

// Prev/next month navigation that drives the `?month=YYYY-MM` URL param. Mirrors
// the URL-state approach used by `date-filter.tsx`.
export function MonthFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const monthParam = params.get('month') || format(new Date(), 'yyyy-MM');
  const current = parse(monthParam, 'yyyy-MM', new Date());

  const pushMonth = (date: Date) => {
    const query = { month: format(date, 'yyyy-MM') };
    const url = qs.stringifyUrl({ url: pathname, query });
    router.push(url);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => pushMonth(subMonths(current, 1))}
        className="size-9 rounded-full border border-[var(--aurex-border)] bg-[var(--aurex-surface)] p-0 text-[var(--aurex-text-1)] hover:bg-[var(--aurex-surface-hover)] hover:text-[var(--aurex-text-1)]"
        aria-label="Previous month"
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="min-w-[120px] text-center text-[13px] font-medium tabular-nums text-[var(--aurex-text-1)]">
        {format(current, 'LLLL yyyy')}
      </span>
      <Button
        size="sm"
        variant="outline"
        onClick={() => pushMonth(addMonths(current, 1))}
        className="size-9 rounded-full border border-[var(--aurex-border)] bg-[var(--aurex-surface)] p-0 text-[var(--aurex-text-1)] hover:bg-[var(--aurex-surface-hover)] hover:text-[var(--aurex-text-1)]"
        aria-label="Next month"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
