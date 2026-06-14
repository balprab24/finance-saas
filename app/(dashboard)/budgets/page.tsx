'use client';

import { MonthFilter } from '@/components/month-filter';
import { PageMasthead } from '@/components/page-masthead';
import { StatementSheet } from '@/components/statement-sheet';
import { LedgerAmount } from '@/components/money';
import { BudgetsTable } from '@/features/budgets/components/budgets-table';
import { useGetBudgets } from '@/features/budgets/api/use-get-budgets';

function LedgerStat({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  /** null while the period's totals are unknown (loading or failed) — rendered
   *  as an em dash so an unreconciled period never reads as a real $0.00. */
  value: number | null;
  tone?: 'neutral' | 'balance';
}) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--aurex-text-3)]">
        {label}
      </div>
      {value === null ? (
        <span className="font-mono text-[18px] font-semibold tabular-nums text-[var(--aurex-text-3)]">
          —
        </span>
      ) : (
        <LedgerAmount value={value} tone={tone} className="text-[18px] font-semibold" />
      )}
    </div>
  );
}

export default function BudgetsPage() {
  const budgetsQuery = useGetBudgets();
  const totals = budgetsQuery.data;

  return (
    <StatementSheet
      masthead={
        <PageMasthead
          title="Budgets"
          meta="Per-category monthly budgets"
          actions={<MonthFilter />}
        />
      }
    >
      {/* The month's plan as a reconciliation strip: Budgeted − Spent = Remaining.
          Until the totals load (or after a failed fetch) the figures read "—",
          never a fabricated reconciled $0.00. */}
      <div className="flex flex-wrap items-center gap-x-10 gap-y-3 border-b border-[var(--aurex-border)] p-5 sm:p-6">
        <LedgerStat label="Budgeted" value={totals ? totals.totalBudgeted : null} />
        <LedgerStat label="Spent" value={totals ? totals.totalSpent : null} />
        <LedgerStat
          label="Remaining"
          value={totals ? totals.totalRemaining : null}
          tone="balance"
        />
      </div>
      <div className="p-5 sm:p-6">
        <BudgetsTable />
      </div>
    </StatementSheet>
  );
}
