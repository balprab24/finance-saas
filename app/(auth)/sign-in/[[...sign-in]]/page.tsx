import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { clerkAppearance } from "@/lib/clerk-appearance";
import { sanitizeRedirectPath } from "@/lib/auth-redirect";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string | string[] }>;
}) {
  const [{ userId }, params] = await Promise.all([auth(), searchParams]);
  // Validate the intended destination from a protected-route deep link. Only
  // same-origin relative paths survive sanitization; everything else is dropped.
  const intended = sanitizeRedirectPath(params.redirect_url);
  // Returning users land in their data (or their intended page); new users with
  // no data see the dashboard's onboarding/empty-state automatically.
  const destination = intended ?? "/dashboard";
  // Preserve the intended destination across the sign-in -> sign-up toggle so the
  // person never loses where they were headed.
  const signUpUrl = intended
    ? `/sign-up?redirect_url=${encodeURIComponent(intended)}`
    : "/sign-up";

  // Already signed in: send them into the app instead of a redundant login form.
  if (userId) redirect(destination);

  return (
    <div className="space-y-5">
      <div className="space-y-1.5 text-center">
        <h1 className="font-display text-[25px] font-medium tracking-[-0.01em] text-[var(--aurex-text-1)]">
          Welcome back
        </h1>
        <p className="text-[13.5px] text-[var(--aurex-text-3)]">
          Sign in to your workspace.
        </p>
      </div>
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl={signUpUrl}
        forceRedirectUrl={destination}
        appearance={clerkAppearance}
      />
    </div>
  );
}
