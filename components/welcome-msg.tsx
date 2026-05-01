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
    <div className="space-y-2">
      <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--aurex-text-3)]">
        <span className="size-1.5 rounded-full bg-[#a5b4fc] shadow-[0_0_8px_#a5b4fc]" />
        Dashboard · {today}
      </span>
      <h2 className="flex items-center gap-x-3 text-[28px] font-semibold tracking-tight text-[var(--aurex-text-1)] lg:text-[36px]">
        {getGreeting()},
        {isLoaded ? (
          <span className="bg-gradient-to-br from-[#a5b4fc] via-[#8b5cf6] to-[#22d3ee] bg-clip-text text-transparent">
            {user?.firstName ?? 'friend'}
          </span>
        ) : (
          <Skeleton className="h-8 w-32 bg-white/10" />
        )}
        <span aria-hidden>👋</span>
      </h2>
      <p className="text-[15px] leading-[1.55] text-[var(--aurex-text-2)] lg:text-[16px]">
        Here&apos;s a snapshot of your finances. Charts, totals, and trends — all up to date.
      </p>
    </div>
  );
}
