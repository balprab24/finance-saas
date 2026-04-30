'use client';

import { useUser } from '@clerk/nextjs';

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

  return (
    <div className="space-y-2 mb-4">
      <h2 className="text-2xl lg:text-4xl text-white font-medium tracking-tight flex items-center gap-x-2">
        {getGreeting()},
        {isLoaded ? (
          <span>{user?.firstName} 👋</span>
        ) : (
          <Skeleton className="h-8 w-32 bg-white/20" />
        )}
      </h2>
      <p className="text-sm lg:text-base text-[#89b6fd]">
        Here&apos;s a snapshot of your finances.
      </p>
    </div>
  );
}
