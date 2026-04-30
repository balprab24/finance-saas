import { SignUp } from '@clerk/nextjs';

import { clerkAppearance } from '@/lib/clerk-appearance';

export default function Page() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Create your account
        </h1>
        <p className="text-sm text-slate-500">
          Start organizing your finances in minutes.
        </p>
      </div>
      <SignUp path="/sign-up" appearance={clerkAppearance} />
    </div>
  );
}
