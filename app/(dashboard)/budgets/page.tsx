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
  value: number;
  tone?: 'neutral' | 'balance';
}) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--aurex-text-3)]">
        {label}
      </div>
      <LedgerAmount value={value} tone={tone} className="text-[18px] font-semibold" />
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
      {/* The month's plan as a reconciliation strip: Budgeted − Spent = Remaining. */}
      <div className="flex flex-wrap items-center gap-x-10 gap-y-3 border-b border-[var(--aurex-border)] p-5 sm:p-6">
        <LedgerStat label="Budgeted" value={totals?.totalBudgeted ?? 0} />
        <LedgerStat label="Spent" value={totals?.totalSpent ?? 0} />
        <LedgerStat label="Remaining" value={totals?.totalRemaining ?? 0} tone="balance" />
      </div>
      <div className="p-5 sm:p-6">
        <BudgetsTable />
      </div>
    </StatementSheet>
  );
}
