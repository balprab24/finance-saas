# Design Brief — Aurex Auth Experience & Home↔Login Flow

## Summary

This feature improves how a person moves between the Aurex marketing landing page, the Clerk-powered authentication screens, and the protected app — and brings those auth screens up to Aurex's brand. It bundles two related-but-distinct concerns: (A) **appearance** of the sign-in/sign-up screens, currently the unstyled Clerk default running on a development instance, and (B) **flow correctness** — where people land after authenticating, what deep-linking a protected route does, and what a signed-in person sees if they revisit an auth page. The flow half carries the real product value; the appearance half is brand polish. Clerk owns all the hard auth internals (verification, reset, sessions, enumeration protection); the surface area here is theming props plus a small set of redirect decisions and one redirect-safety guard.

## Goals

- Auth screens visually match the Aurex dark card brand instead of the bare Clerk default.
- New users land in onboarding/empty-state; returning users land in their data.
- Deep-linking a protected route then authenticating returns the person to their intended destination.
- A signed-in person who hits an auth page is sent into the app, not shown a login form.
- Sign-out returns to the public landing page.
- Establish the deployment prerequisite (Clerk production instance) as a known, separate track from the visual work.

## Non-goals

- Building anything Clerk already provides (password reset, MFA, email verification, session refresh, enumeration protection).
- A headless/custom auth UI; the prebuilt Clerk components plus appearance theming are the intended path.
- Social/OAuth providers in the first cut.
- Animated home↔auth route transitions.
- A local `users` table, onboarding wizard, or persisted profile preferences.
- Account-deletion data cleanup, data export, and legal pages — real and important, but tracked as separate deployment-readiness work, not part of this feature.

## User stories

- As a **new visitor**, I sign up from the landing page and arrive in an empty, ready-to-use workspace that invites me to start.
- As a **returning user**, I sign in and immediately see my own accounts and transactions.
- As a **deep-linker**, I open a protected URL while signed out, authenticate, and land on that exact page rather than a generic dashboard.
- As an **already-signed-in user**, I navigate to a sign-in URL and am sent straight into the app instead of a redundant login form.
- As **any user**, I sign out and return to the public landing page.
- As a **brand-conscious owner**, I want the auth screens to feel like the same product as the marketing page.

## MVP behavior

- Auth screens are themed with Aurex tokens so they read as part of the product.
- Sign-up completion routes to the onboarding/empty-state dashboard; sign-in completion routes to the user's data (or their intended page if one was requested).
- Toggling between sign-in and sign-up preserves any intended-destination context so the person never loses where they were headed.
- Hitting an auth page while authenticated redirects into the app.
- Sign-out lands on `/`.
- Intended-destination redirects accept only same-origin relative paths; absolute and protocol-relative targets are rejected.
- Server-side route protection remains the real gate; auth-aware UI is treated as cosmetic and must not leak protected content during the auth-state hydration flash.

## Later enhancements

- Social/OAuth sign-in.
- Guided first-run onboarding beyond the empty state.
- Subtle, brand-consistent transitions between landing and auth.
- Persisted "welcome seen" / onboarding-dismissed state (only if onboarding becomes its own feature).

## UX flow

- **Anon → Sign up:** landing → sign-up → verification → onboarding/empty dashboard (with demo-seed offer).
- **Anon → Sign in:** landing → sign-in → their data.
- **Anon deep-link:** opens protected route → bounced to sign-in carrying the intended destination → authenticates → returns to the intended route.
- **Sign-in / sign-up toggle:** intended destination is preserved across the switch.
- **Authenticated on landing:** primary CTA reads as "Go to dashboard."
- **Authenticated hits auth page:** redirected into the app.
- **Sign-out:** returns to landing.

## Data / privacy considerations

- **No schema change expected.** Tenancy stays a Clerk `userId` string on existing entities; Clerk holds the profile. Adding tables here is a scope-creep signal.
- **Open redirect is the headline risk.** Any "return to intended page" must validate the target as a same-origin relative path; absolute or `//host` targets are a phishing vector.
- **Server-side gating is the boundary.** Conditional UI is presentation only; the middleware-level protection is what actually guards data.
- **Public key is meant to be public**; the secret key stays server-only.
- Keep nothing identifying in auth URLs beyond a relative destination.
- **Adjacent, out-of-scope but real:** running on a Clerk _development_ instance is itself a privacy concern (real users would enter a shared dev environment); production deployment also needs account-deletion cleanup, data export, and a privacy policy. These are flagged here so they aren't forgotten, but they belong to deployment-readiness, not this feature.

## Open questions

- What's the real driver — observed friction, or brand/aesthetics? (Shapes how much to invest.)
- Confirm prebuilt-Clerk-components-plus-theming over headless. (Largest scope fork.)
- Post-sign-up: straight into the demo-seeded dashboard, or a guided first run? (Decides whether onboarding enters scope.)
- Defer OAuth explicitly, or include it?
- Single-user for now, or real external signups imminent? (Justifies polish vs. shipping bigger product gaps like CSV category mapping, budgets, export.)
- How will "better" be judged with no analytics — is a manual flow checklist the acceptance test?

## Suggested build stages

- **Stage 0 — Baseline & acceptance.** Define what "better" means; write the manual flow checklist that serves as the acceptance test.
- **Stage 1 — Appearance.** Theme the auth screens with Aurex tokens. Appearance-only, no logic, lowest risk.
- **Stage 2 — Flow correctness.** Redirect targets, signed-in guard on auth pages, validated intended-destination redirect, sign-out destination.
- **Stage 3 — New-vs-returning handoff.** New users to onboarding/demo; returning users to data; destination preserved across the sign-in/sign-up toggle.
- **Stage 4 (optional, later).** Social login and polish.
- **Parallel track (deployment-readiness, separate feature).** Clerk production instance, account-deletion cleanup, data export, legal pages.

## Final coding-agent prompt — Stage 1 (Appearance only)

> **Task:** Theme the Aurex authentication screens so they visually match the Aurex brand. **Appearance only — do not change any routing, redirect, or auth logic in this stage.**
>
> **Context:** Next.js 15 App Router, React 19, TypeScript, Tailwind v4, shadcn-style primitives in `components/ui/`. Auth is Clerk via `@clerk/nextjs`, with `/sign-in` and `/sign-up` screens already rendered inside an Aurex dark card layout. Aurex design tokens: warm-neutral dark backgrounds, subtle borders, indigo primary action, cyan accent, green income, rose expense, amber warning. The marketing landing page is the brand reference for typography, color, and feel.
>
> **Do:**
>
> - Apply Aurex tokens to the prebuilt Clerk `<SignIn>` and `<SignUp>` components via Clerk's appearance/theming configuration so they read as part of the product (background, card, inputs, primary button, links, error states, focus rings).
> - Keep both screens visually consistent with each other and with the existing dark card layout, on both desktop and mobile.
> - Verify the screens match the marketing page's brand language.
>
> **Do not:**
>
> - Change redirect targets, post-auth destinations, the signed-in guard, sign-out behavior, or `middleware.ts`.
> - Replace the prebuilt Clerk components with a headless/custom auth UI.
> - Add social/OAuth providers, new routes, dependencies, or any data-model change.
> - Touch the Clerk instance configuration or environment keys.
>
> **Constraints to preserve:** Public routes stay narrowly allowlisted in `middleware.ts`; secrets stay server-only; no secrets, screenshots, or auth artifacts committed.
>
> **Note for the agent:** Clerk's appearance API and prop names have changed across versions — confirm the current theming approach against Clerk's docs rather than relying on remembered prop names.
>
> **Acceptance:** `/sign-in` and `/sign-up` look like Aurex (not the default Clerk theme), are consistent with each other and the landing page, work on desktop and mobile, and behave functionally exactly as before.
