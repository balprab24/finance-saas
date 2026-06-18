'use client';

import { DatabaseZap, Loader2, PlusCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PageMasthead } from '@/components/page-masthead';
import { StatementSection } from '@/components/statement-section';
import { useNewAccount } from '@/features/accounts/hooks/use-new-account';
import { useSeedDemoWorkspace } from '@/features/onboarding/api/use-seed-demo-workspace';

// The first-run dashboard, rendered as the same statement sheet the populated
// dashboard is (app/(dashboard)/dashboard/page.tsx): a "Statement" masthead over
// one ruled frame whose sections are divided by hairlines — never a two-column
// hero with nested preview cards. The screen a new user first sees should look
// like the document they are about to fill, so loading data simply turns the
// same frame from empty to inked.
const DEMO_INCLUDES = [
  ['Accounts', 'Checking, credit, and savings'],
  ['Categories', 'Salary, rent, groceries, dining'],
  ['Transactions', 'Payroll, bills, subscriptions, everyday spend'],
] as const;

export function DashboardEmptyState() {
  const newAccount = useNewAccount();
  const seedDemo = useSeedDemoWorkspace();

  return (
    <div className="aurex-card overflow-hidden p-0">
      <PageMasthead
        title="Statement"
        meta="No activity yet — load a sample workspace or add your first account to see your cash position."
      />

      {/* The lead occupies the slot the net figure fills once there is data, so
          the empty sheet and the inked one share a silhouette. */}
      <div className="border-b border-[var(--aurex-rule)] p-5 sm:p-6">
        <h2 className="max-w-[18ch] text-balance font-display text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] text-[var(--aurex-text-1)] sm:text-[34px]">
          Build your first clear money picture.
        </h2>
        <p className="mt-3 max-w-[60ch] text-[14.5px] leading-7 text-[var(--aurex-text-2)]">
          Start with a realistic sample workspace to explore the dashboard end to
          end, or create your first account and add your own transactions from
          scratch.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            disabled={seedDemo.isPending}
            onClick={() => seedDemo.mutate()}
            className="h-10 bg-[var(--aurex-brand)] px-4 text-white hover:bg-[var(--aurex-bar)]"
          >
            {seedDemo.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <DatabaseZap className="mr-2 size-4" />
            )}
            {seedDemo.isPending ? 'Loading sample data…' : 'Load sample data'}
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

      {/* What the sample fills in, as ruled statement rows — not nested cards. */}
      <StatementSection
        title="What the sample workspace includes"
        caption="75 days of realistic activity, ready to explore or clear whenever you like."
      >
        <dl className="divide-y divide-[var(--aurex-border)]">
          {DEMO_INCLUDES.map(([term, detail]) => (
            <div
              key={term}
              className="flex items-baseline justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <dt className="shrink-0 text-[13.5px] font-medium text-[var(--aurex-text-1)]">
                {term}
              </dt>
              <dd className="min-w-0 text-right text-[12.5px] text-[var(--aurex-text-3)]">
                {detail}
              </dd>
            </div>
          ))}
        </dl>
      </StatementSection>
    </div>
  );
}
