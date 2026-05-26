import { SignIn } from '@clerk/nextjs';

import { clerkAppearance } from '@/lib/clerk-appearance';

export default function Page() {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5 text-center">
        <h1 className="text-[22px] font-semibold tracking-tight text-[var(--aurex-text-1)]">
          Welcome back
        </h1>
        <p className="text-[13.5px] text-[var(--aurex-text-3)]">
          Sign in to continue tracking your money.
        </p>
      </div>
      <SignIn
        path="/sign-in"
        routing="path"
        fallbackRedirectUrl="/dashboard"
        appearance={clerkAppearance}
      />
    </div>
  );
}
