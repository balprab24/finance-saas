'use client';

import { ArrowRight, DatabaseZap, Loader2, PlusCircle, ShieldCheck, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useNewAccount } from '@/features/accounts/hooks/use-new-account';
import { useSeedDemoWorkspace } from '@/features/onboarding/api/use-seed-demo-workspace';

export function DashboardEmptyState() {
  const newAccount = useNewAccount();
  const seedDemo = useSeedDemoWorkspace();

  return (
    <section className="aurex-card relative overflow-hidden p-6 lg:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-[rgba(34,211,238,0.18)] blur-[90px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 left-10 h-80 w-80 rounded-full bg-[rgba(99,102,241,0.22)] blur-[110px]"
      />
      <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--aurex-border)] bg-[var(--aurex-surface)] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--aurex-text-3)]">
            <Sparkles className="size-3.5 text-[#a5b4fc]" />
            First run
          </div>
          <h2 className="text-[32px] font-semibold tracking-tight text-[var(--aurex-text-1)] lg:text-[44px]">
            Build your first clear money picture.
          </h2>
          <p className="mt-4 max-w-xl text-[15px] leading-7 text-[var(--aurex-text-2)] lg:text-[16px]">
            Start with a realistic Aurex workspace to explore the dashboard, or create your first
            account and add your own transactions from scratch.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button
              disabled={seedDemo.isPending}
              onClick={() => seedDemo.mutate()}
              className="h-11 bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] px-5 text-white shadow-[0_10px_30px_rgba(99,102,241,0.34)] hover:from-[#7a7df7] hover:to-[#9b6cf8]"
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
              className="h-11 border-[var(--aurex-border)] bg-[var(--aurex-surface)] px-5 text-[var(--aurex-text-1)] hover:bg-[var(--aurex-surface-hover)]"
              onClick={newAccount.onOpen}
            >
              <PlusCircle className="mr-2 size-4" />
              Create first account
            </Button>
          </div>
        </div>
        <div className="relative rounded-[20px] border border-[var(--aurex-border)] bg-[rgba(8,12,24,0.72)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--aurex-text-3)]">
                Demo preview
              </p>
              <p className="mt-1 text-[18px] font-semibold text-[var(--aurex-text-1)]">
                75 days of activity
              </p>
            </div>
            <div className="grid size-10 place-items-center rounded-[12px] bg-[rgba(52,211,153,0.14)] text-[#34d399] ring-1 ring-[rgba(52,211,153,0.3)]">
              <ShieldCheck className="size-5" />
            </div>
          </div>
          <div className="space-y-3">
            {[
              ['Accounts', 'Checking, credit, savings'],
              ['Categories', 'Salary, rent, groceries, dining'],
              ['Transactions', 'Payroll, bills, subscriptions, spend'],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-[14px] border border-[var(--aurex-border)] bg-[var(--aurex-surface)] px-4 py-3"
              >
                <div>
                  <p className="text-[13px] font-medium text-[var(--aurex-text-1)]">{label}</p>
                  <p className="mt-0.5 text-[12px] text-[var(--aurex-text-3)]">{value}</p>
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
