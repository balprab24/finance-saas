'use client';

import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';

type Payload = { value: number };

export function CustomTooltip({ active, payload }: { active?: boolean; payload?: Payload[] & { payload?: { date: Date | string } }[] }) {
  if (!active || !payload?.length) return null;
  const date = (payload[0] as unknown as { payload: { date: Date | string } }).payload.date;
  const income = payload[0].value;
  const expenses = payload[1]?.value ?? 0;

  return (
    <div className="rounded-xl bg-white shadow-lg ring-1 ring-black/5 overflow-hidden">
      <div className="text-xs font-medium p-2 px-3 bg-muted/60 text-muted-foreground">
        {format(new Date(date), 'MMM dd, yyyy')}
      </div>
      <Separator />
      <div className="p-2.5 px-3 space-y-1.5">
        <div className="flex items-center justify-between gap-x-4">
          <div className="flex items-center gap-x-2">
            <div className="size-1.5 bg-blue-500 rounded-full" />
            <p className="text-sm text-muted-foreground">Income</p>
          </div>
          <p className="text-sm text-right font-medium">{formatCurrency(income)}</p>
        </div>
        <div className="flex items-center justify-between gap-x-4">
          <div className="flex items-center gap-x-2">
            <div className="size-1.5 bg-rose-500 rounded-full" />
            <p className="text-sm text-muted-foreground">Expenses</p>
          </div>
          <p className="text-sm text-right font-medium">{formatCurrency(expenses)}</p>
        </div>
      </div>
    </div>
  );
}
