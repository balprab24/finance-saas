import { SignUp } from '@clerk/nextjs';

import { clerkAppearance } from '@/lib/clerk-appearance';

export default function Page() {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5 text-center">
        <h1 className="text-[22px] font-semibold tracking-tight text-[var(--aurex-text-1)]">
          Create your account
        </h1>
        <p className="text-[13.5px] text-[var(--aurex-text-3)]">
          Start organizing your finances in minutes.
        </p>
      </div>
      <SignUp
        path="/sign-up"
        routing="path"
        fallbackRedirectUrl="/dashboard"
        appearance={clerkAppearance}
      />
    </div>
  );
}
