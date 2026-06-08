import { formatCurrency, formatPercentage } from '@/lib/utils';

type Props = {
  data?: { name: string; value: number }[];
};

// "Where the money went" as a ranked ledger instead of a donut: each row is a
// category with a graphite share bar (length = magnitude), a right-aligned Geist
// Mono amount, and its share of the period. Decimals align down the column; a
// ruled Total closes the statement. No rainbow palette — identity is the label.
export function CategoryLedger({ data = [] }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-[260px] flex-col items-center justify-center text-center">
        <p className="text-[13px] text-[var(--aurex-text-3)]">No spending in this period</p>
      </div>
    );
  }

  const rows = [...data].sort((a, b) => b.value - a.value);
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  const max = rows[0]?.value || 1;

  return (
    <div className="space-y-4">
      <ul className="space-y-3.5">
        {rows.map((row) => {
          const share = total > 0 ? (row.value / total) * 100 : 0;
          const barWidth = Math.max((row.value / max) * 100, 2);
          return (
            <li key={row.name} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-[13.5px] text-[var(--aurex-text-2)]">{row.name}</span>
                <span className="shrink-0 font-mono text-[13.5px] font-medium tabular-nums text-[var(--aurex-text-1)]">
                  {formatCurrency(row.value)}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--aurex-surface)]">
                  <div
                    className="h-full rounded-full bg-[var(--aurex-bar)]"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className="w-9 shrink-0 text-right font-mono text-[11.5px] tabular-nums text-[var(--aurex-text-3)]">
                  {formatPercentage(share)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex items-baseline justify-between border-t border-[var(--aurex-border)] pt-3">
        <span className="text-[12px] font-medium text-[var(--aurex-text-3)]">Total</span>
        <span className="font-mono text-[14px] font-semibold tabular-nums text-[var(--aurex-text-1)]">
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  );
}
