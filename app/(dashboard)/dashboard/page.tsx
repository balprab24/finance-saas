'use client';

import { StatementMasthead } from '@/components/statement-masthead';
import { CashPosition } from '@/components/cash-position';
import { DataCharts } from '@/components/data-charts';
import { ThisMonthStrip } from '@/components/this-month-strip';
import { DashboardEmptyState } from '@/components/dashboard-empty-state';
import { useGetOnboardingStatus } from '@/features/onboarding/api/use-get-onboarding-status';

// The dashboard as one financial statement (Direction A, "The Statement"): a single
// ruled sheet — masthead → cash position (In − Out = Net) → cash-flow / where-it-went
// → a quiet this-month footer — instead of a stack of separate cards. Sections are
// divided by hairlines, not enclosed in their own boxes.
export default function DashboardPage() {
  const onboardingStatus = useGetOnboardingStatus();
  const showEmptyState = onboardingStatus.data?.isEmpty === true;

  if (showEmptyState) {
    return (
      <div className="mx-auto w-full max-w-screen-2xl pb-16 pt-6">
        <DashboardEmptyState />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-screen-2xl pb-16 pt-6">
      <div className="aurex-card overflow-hidden p-0">
        <StatementMasthead />
        <CashPosition />
        <DataCharts />
        <ThisMonthStrip />
      </div>
    </div>
  );
}
