'use client';

import { ArrowRight, DatabaseZap, Loader2, PlusCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useNewAccount } from '@/features/accounts/hooks/use-new-account';
import { useSeedDemoWorkspace } from '@/features/onboarding/api/use-seed-demo-workspace';

export function DashboardEmptyState() {
  const newAccount = useNewAccount();
  const seedDemo = useSeedDemoWorkspace();

  return (
    <section className="aurex-card p-6 lg:p-8">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-[var(--aurex-border)] bg-[var(--aurex-surface)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--aurex-text-3)]">
            First run
          </div>
          <h2 className="text-[26px] font-semibold tracking-tight text-[var(--aurex-text-1)] lg:text-[34px]">
            Build your first clear money picture.
          </h2>
          <p className="mt-3 max-w-xl text-[14.5px] leading-7 text-[var(--aurex-text-2)]">
            Start with a realistic Aurex workspace to explore the dashboard, or create your first
            account and add your own transactions from scratch.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button
              disabled={seedDemo.isPending}
              onClick={() => seedDemo.mutate()}
              className="h-10 bg-[var(--aurex-brand)] px-4 text-white hover:bg-[#7a7df7]"
            >
              {seedDemo.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <DatabaseZap className="mr-2 size-4" />
              )}
              Load demo data
            </Button>
            <Button
              disabled={seedDemo.isPending}
              variant="outline"
              className="h-10 border-[var(--aurex-border)] bg-[var(--aurex-surface)] px-4 text-[var(--aurex-text-1)] hover:bg-[var(--aurex-surface-hover)]"
              onClick={newAccount.onOpen}
            >
              <PlusCircle className="mr-2 size-4" />
              Create first account
            </Button>
          </div>
        </div>
        <div className="rounded-md border border-[var(--aurex-border)] bg-[var(--aurex-surface)] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--aurex-text-3)]">
                Demo preview
              </p>
              <p className="mt-1 text-[16px] font-semibold text-[var(--aurex-text-1)]">
                75 days of activity
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {[
              ['Accounts', 'Checking, credit, savings'],
              ['Categories', 'Salary, rent, groceries, dining'],
              ['Transactions', 'Payroll, bills, subscriptions, spend'],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-md border border-[var(--aurex-border)] bg-[var(--aurex-bg-elev)] px-3.5 py-2.5"
              >
                <div>
                  <p className="text-[13px] font-medium text-[var(--aurex-text-1)]">{label}</p>
                  <p className="mt-0.5 text-[11.5px] text-[var(--aurex-text-3)]">{value}</p>
                </div>
                <ArrowRight className="size-4 text-[var(--aurex-text-3)]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
