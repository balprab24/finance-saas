import { Skeleton } from '@/components/ui/skeleton';

const PAGE = 'mx-auto w-full max-w-screen-2xl pt-6 pb-16';

/** The shared statement masthead in skeleton form: grotesque title + meta line,
 *  with a right-aligned action placeholder, over the major rule. */
function MastheadSkeleton() {
  return (
    <div className="flex flex-col gap-3 border-b border-[var(--aurex-rule)] p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-6 w-40 bg-black/[0.06]" />
        <Skeleton className="h-3 w-28 bg-black/[0.05]" />
      </div>
      <Skeleton className="h-9 w-full rounded-md bg-black/[0.06] lg:w-44" />
    </div>
  );
}

/** One statement sheet with a table-shaped body. Used by list routes — mirrors
 *  the real masthead-over-sheet geometry so the page doesn't reflow on data land. */
export function TablePageSkeleton() {
  return (
    <div className={PAGE}>
      <div className="aurex-card overflow-hidden p-0">
        <MastheadSkeleton />
        <div className="space-y-3 p-5 sm:p-6">
          <Skeleton className="h-9 w-full rounded-md bg-black/[0.05] sm:max-w-xs" />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full rounded-md bg-black/[0.05]" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** One statement sheet: masthead → cash position → chart/ledger → this-month.
 *  Matches the real dashboard geometry so the page doesn't reflow on data land. */
export function DashboardSkeleton() {
  return (
    <div className={PAGE}>
      <div className="aurex-card overflow-hidden p-0">
        {/* Masthead */}
        <div className="flex flex-col gap-3 border-b border-[var(--aurex-rule)] p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32 bg-black/[0.06]" />
            <Skeleton className="h-3 w-56 max-w-full bg-black/[0.05]" />
          </div>
          <Skeleton className="h-9 w-full rounded-full bg-black/[0.06] lg:w-64" />
        </div>
        {/* Cash position */}
        <div className="border-b border-[var(--aurex-rule)] p-5 sm:p-6">
          <Skeleton className="h-3 w-28 bg-black/[0.06]" />
          <Skeleton className="mt-3 h-12 w-56 max-w-full bg-black/[0.06]" />
          <Skeleton className="mt-4 h-4 w-72 max-w-full bg-black/[0.05]" />
        </div>
        {/* Chart + ledger */}
        <div className="grid grid-cols-1 divide-y divide-[var(--aurex-border)] border-b border-[var(--aurex-rule)] lg:grid-cols-[1.6fr_1fr] lg:divide-x lg:divide-y-0">
          <div className="p-5">
            <Skeleton className="h-5 w-28 bg-black/[0.06]" />
            <Skeleton className="mt-4 h-[220px] w-full rounded-md bg-black/[0.05] sm:h-[300px]" />
          </div>
          <div className="space-y-4 p-5">
            <Skeleton className="h-5 w-28 bg-black/[0.06]" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-full bg-black/[0.06]" />
                <Skeleton className="h-1.5 w-full bg-black/[0.05]" />
              </div>
            ))}
          </div>
        </div>
        {/* This month */}
        <div className="grid grid-cols-1 divide-y divide-[var(--aurex-border)] lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-4 p-5">
              <Skeleton className="h-3 w-28 bg-black/[0.06]" />
              <Skeleton className="h-8 w-32 bg-black/[0.06]" />
              <Skeleton className="h-2 w-full bg-black/[0.05]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** One statement sheet with a single tall body block. Used by budgets/insights. */
export function CardPageSkeleton() {
  return (
    <div className={PAGE}>
      <div className="aurex-card overflow-hidden p-0">
        <MastheadSkeleton />
        <div className="p-5 sm:p-6">
          <Skeleton className="h-[420px] w-full rounded-md bg-black/[0.05]" />
        </div>
      </div>
    </div>
  );
}
