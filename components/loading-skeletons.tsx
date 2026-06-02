import { Skeleton } from '@/components/ui/skeleton';

const PAGE = 'mx-auto w-full max-w-screen-2xl pt-6 pb-16';

function PageHeading() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-3 w-24 bg-white/8" />
      <Skeleton className="h-7 w-72 max-w-full bg-white/8" />
    </div>
  );
}

/** Header + card with a table-shaped body. Used by list routes. */
export function TablePageSkeleton() {
  return (
    <div className={`${PAGE} space-y-5`}>
      <PageHeading />
      <div className="aurex-card p-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-40 bg-white/8" />
          <Skeleton className="h-9 w-32 rounded-md bg-white/8" />
        </div>
        <div className="mt-5 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full rounded-md bg-white/[0.06]" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Stat cards + two side panels + a chart block. Used by the dashboard. */
export function DashboardSkeleton() {
  return (
    <div className={`${PAGE} space-y-6`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64 bg-white/8" />
          <Skeleton className="h-4 w-44 bg-white/[0.06]" />
        </div>
        <Skeleton className="h-9 w-64 rounded-md bg-white/8" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl bg-white/[0.06]" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-44 rounded-xl bg-white/[0.06]" />
        <Skeleton className="h-44 rounded-xl bg-white/[0.06]" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Skeleton className="h-[420px] rounded-xl bg-white/[0.06]" />
        <Skeleton className="h-[420px] rounded-xl bg-white/[0.06]" />
      </div>
    </div>
  );
}

/** Generic header + single card block. Used by budgets/insights. */
export function CardPageSkeleton() {
  return (
    <div className={`${PAGE} space-y-5`}>
      <PageHeading />
      <Skeleton className="h-[460px] w-full rounded-xl bg-white/[0.06]" />
    </div>
  );
}
