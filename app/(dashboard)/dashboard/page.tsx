'use client';

import { DataCharts } from '@/components/data-charts';
import { DataGrid } from '@/components/data-grid';
import { DashboardEmptyState } from '@/components/dashboard-empty-state';
import { Filters } from '@/components/filters';
import { WelcomeMsg } from '@/components/welcome-msg';
import { useGetOnboardingStatus } from '@/features/onboarding/api/use-get-onboarding-status';

export default function DashboardPage() {
  const onboardingStatus = useGetOnboardingStatus();
  const showEmptyState = onboardingStatus.data?.isEmpty === true;

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-8 pb-16 pt-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <WelcomeMsg />
        <Filters />
      </div>
      {showEmptyState ? (
        <DashboardEmptyState />
      ) : (
        <>
          <DataGrid />
          <DataCharts />
        </>
      )}
    </div>
  );
}
