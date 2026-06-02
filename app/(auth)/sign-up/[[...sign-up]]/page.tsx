import { SignUp } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { clerkAppearance } from '@/lib/clerk-appearance';
import { sanitizeRedirectPath } from '@/lib/auth-redirect';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string | string[] }>;
}) {
  const [{ userId }, params] = await Promise.all([auth(), searchParams]);
  // Validate the intended destination from a protected-route deep link. Only
  // same-origin relative paths survive sanitization; everything else is dropped.
  const intended = sanitizeRedirectPath(params.redirect_url);
  // A deep-link intent wins if present; otherwise a brand-new user lands on the
  // dashboard, which renders the onboarding/empty-state + demo-seed offer.
  const destination = intended ?? '/dashboard';
  // Preserve the intended destination across the sign-up -> sign-in toggle so the
  // person never loses where they were headed.
  const signInUrl = intended
    ? `/sign-in?redirect_url=${encodeURIComponent(intended)}`
    : '/sign-in';

  // Already signed in: send them into the app instead of a redundant sign-up form.
  if (userId) redirect(destination);

  return (
    <div className="space-y-5">
      <div className="space-y-1.5 text-center">
        <h1 className="font-display text-[25px] font-medium tracking-[-0.01em] text-[var(--aurex-text-1)]">
          Create your account
        </h1>
        <p className="text-[13.5px] text-[var(--aurex-text-3)]">
          Start organizing your finances in minutes.
        </p>
      </div>
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl={signInUrl}
        forceRedirectUrl={destination}
        appearance={clerkAppearance}
      />
    </div>
  );
}
