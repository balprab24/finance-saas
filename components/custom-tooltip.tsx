'use client';

import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';

type Payload = { value: number };

export function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Payload[] & { payload?: { date: Date | string } }[];
}) {
  if (!active || !payload?.length) return null;
  const date = (payload[0] as unknown as { payload: { date: Date | string } }).payload.date;
  const income = payload[0].value;
  const expenses = payload[1]?.value ?? 0;

  return (
    <div
      className="overflow-hidden rounded-xl border border-[var(--aurex-border-strong)] bg-[var(--aurex-bg-elev)] shadow-[0_12px_32px_rgba(0,0,0,0.16)]"
    >
      <div className="border-b border-[var(--aurex-border)] px-3 py-2 text-[12px] font-medium text-[var(--aurex-text-3)]">
        {format(new Date(date), 'MMM dd, yyyy')}
      </div>
      <div className="space-y-1.5 px-3 py-2.5">
        <div className="flex items-center justify-between gap-x-6">
          <div className="flex items-center gap-x-2">
            <span className="size-1.5 rounded-full bg-[#117a4b]" />
            <p className="text-[13px] text-[var(--aurex-text-2)]">Income</p>
          </div>
          <p className="text-right font-mono text-[13px] font-semibold tabular-nums text-[var(--aurex-text-1)]">
            {formatCurrency(income)}
          </p>
        </div>
        <div className="flex items-center justify-between gap-x-6">
          <div className="flex items-center gap-x-2">
            <span className="size-1.5 rounded-full bg-[#c0392b]" />
            <p className="text-[13px] text-[var(--aurex-text-2)]">Expenses</p>
          </div>
          <p className="text-right font-mono text-[13px] font-semibold tabular-nums text-[var(--aurex-text-1)]">
            {formatCurrency(expenses)}
          </p>
        </div>
      </div>
    </div>
  );
}
