'use client';

import { useUser } from '@clerk/nextjs';
import { format } from 'date-fns';

import { Skeleton } from '@/components/ui/skeleton';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return 'Up late';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function WelcomeMsg() {
  const { user, isLoaded } = useUser();
  const today = format(new Date(), 'EEEE, MMMM d');

  return (
    <div className="space-y-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--aurex-text-3)]">
        Dashboard · {today}
      </span>
      <h2 className="flex items-center gap-x-2 font-display text-[26px] font-medium tracking-[-0.01em] text-[var(--aurex-text-1)] lg:text-[30px]">
        {getGreeting()},{' '}
        {isLoaded ? (
          <span className="text-[var(--aurex-text-1)]">{user?.firstName ?? 'friend'}</span>
        ) : (
          <Skeleton className="h-7 w-28 bg-white/8" />
        )}
      </h2>
      <p className="text-[13.5px] leading-[1.55] text-[var(--aurex-text-3)]">
        A snapshot of your accounts, totals, and trends.
      </p>
    </div>
  );
}
