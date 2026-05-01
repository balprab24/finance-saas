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
      className="overflow-hidden rounded-xl border border-[var(--aurex-border-strong)] bg-[rgba(11,15,36,0.92)] shadow-[0_24px_48px_-16px_rgba(0,0,0,0.7)] backdrop-blur-md"
    >
      <div className="border-b border-[var(--aurex-border)] px-3 py-2 text-[12px] font-medium text-[var(--aurex-text-3)]">
        {format(new Date(date), 'MMM dd, yyyy')}
      </div>
      <div className="space-y-1.5 px-3 py-2.5">
        <div className="flex items-center justify-between gap-x-6">
          <div className="flex items-center gap-x-2">
            <span className="size-1.5 rounded-full bg-[#34d399] shadow-[0_0_8px_#34d399]" />
            <p className="text-[13px] text-[var(--aurex-text-2)]">Income</p>
          </div>
          <p className="text-right text-[13px] font-semibold tabular-nums text-[var(--aurex-text-1)]">
            {formatCurrency(income)}
          </p>
        </div>
        <div className="flex items-center justify-between gap-x-6">
          <div className="flex items-center gap-x-2">
            <span className="size-1.5 rounded-full bg-[#fb7185] shadow-[0_0_8px_#fb7185]" />
            <p className="text-[13px] text-[var(--aurex-text-2)]">Expenses</p>
          </div>
          <p className="text-right text-[13px] font-semibold tabular-nums text-[var(--aurex-text-1)]">
            {formatCurrency(expenses)}
          </p>
        </div>
      </div>
    </div>
  );
}
