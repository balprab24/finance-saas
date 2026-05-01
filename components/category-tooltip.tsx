'use client';

import { formatCurrency } from '@/lib/utils';

type Payload = { value: number; payload: { name: string } };

export function CategoryTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Payload[];
}) {
  if (!active || !payload?.length) return null;
  const name = payload[0].payload.name;
  const value = payload[0].value;

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--aurex-border-strong)] bg-[rgba(11,15,36,0.92)] shadow-[0_24px_48px_-16px_rgba(0,0,0,0.7)] backdrop-blur-md">
      <div className="border-b border-[var(--aurex-border)] px-3 py-2 text-[12px] font-medium text-[var(--aurex-text-3)]">
        {name}
      </div>
      <div className="space-y-1.5 px-3 py-2.5">
        <div className="flex items-center justify-between gap-x-6">
          <div className="flex items-center gap-x-2">
            <span className="size-1.5 rounded-full bg-[#fb7185] shadow-[0_0_8px_#fb7185]" />
            <p className="text-[13px] text-[var(--aurex-text-2)]">Expenses</p>
          </div>
          <p className="text-right text-[13px] font-semibold tabular-nums text-[var(--aurex-text-1)]">
            {formatCurrency(value * -1)}
          </p>
        </div>
      </div>
    </div>
  );
}
