# Dashboard Improvement Spec

Derived from the impeccable critique of `app/(dashboard)/dashboard/page.tsx`
(score 27/40, snapshot: `.impeccable/critique/2026-06-05T17-18-13Z__app-dashboard-dashboard-page-tsx.md`).

**Status:** spec only — not implemented. This document is the build plan; no source
files have been changed.

## Scope

In scope (confirmed):
1. **P1** — Trustworthy failure: stop rendering $0.00 when a summary/query errors.
2. **P1** — Contrast: the KPI date-range caption uses a token that fails WCAG AA.
3. **P2** — Money typography: unify all dashboard figures on Geist Mono.
4. **P2 (judgment call, in scope)** — Differentiate the Budget/Insights teaser cards
   so five cards stop reading as one repeated module.
5. **P3 (judgment call, in scope)** — Trim the category-spend chart variants.

Out of scope (deferred):
- Grouping the 7-item top nav (global navigation change; revisit separately).
- Keyboard shortcuts / saved filter+chart defaults (Alex persona; separate effort).
- The site-wide `--aurex-text-4`-as-text audit beyond the dashboard (see Follow-ups).
- Refetch pending-indicator (minor; see Follow-ups).

## Design invariants this spec must hold

- Money stays integer milliunits; figures already convert via `convertAmountFromMiliunits`. No math changes.
- DESIGN.md rules: **Mono-Figure Rule** (every amount in Geist Mono `tabular-nums`),
  **Flat-By-Default**, **One Voice** (indigo only on action), **Color-Means-Money**.
- Surface query errors with `readApiError` (`lib/api-errors.ts`), per CLAUDE.md habit.

---

## Item 1 — P1: Trustworthy failure (no fabricated $0.00)

**Problem.** `DataGrid` and `DataCharts` branch only on `isLoading` vs data. `useGetSummary`
uses `keepPreviousData`, so:
- On a **refetch** error after data exists, the last-good numbers are kept (acceptable) but
  there is no signal the refresh failed.
- On a **first-load** error, `isLoading` is false and `data` is undefined, so KPI cards fall
  through to `value = 0` and render **$0.00 / 0%** as if real. Same pattern in
  `BudgetSummaryCard` and `InsightsTeaserCard`.

**Files.**
- `components/data-grid.tsx`
- `components/data-charts.tsx`
- `components/budget-summary-card.tsx`
- `components/insights-teaser-card.tsx`
- New: `components/data-error.tsx` (shared inline error state).

**Change.**
1. Add `components/data-error.tsx`: a flat `aurex-card` matching the surrounding card
   geometry, containing a neutral icon (e.g. `lucide-react` `TriangleAlert` in
   `--aurex-text-3`, no rose — this is a load failure, not a financial loss), a plain message
   ("Couldn't load your summary"), and a ghost **Try again** button (`aurex-button-ghost` or
   `Button variant="outline"`) wired to the query's `refetch`. Accept props:
   `{ title?, message?, onRetry, className? }` so it can fill a KPI row, a chart slot, or a
   single teaser card.
2. `DataGrid`: pull `isError` and `refetch` from `useGetSummary()`. Order branches
   `isLoading → isError → data`. On `isError`, render `<DataError>` spanning the 3-column grid
   with `onRetry={refetch}`. Never render `DataCard` with a defaulted value on error.
3. `DataCharts`: same; render a single `<DataError>` across the chart row on `isError`.
4. `BudgetSummaryCard` / `InsightsTeaserCard`: each currently branches only `isLoading`. Add
   an `isError` branch (combine the two queries in the Insights card: error if either errors)
   that renders `<DataError>` sized to the card (`h-[170px]`), with `onRetry` calling both
   `refetch`s.
5. Optional polish (keep small): thread `readApiError(response)` into the `useGetSummary`
   `queryFn` so the thrown error carries the server message; `DataError` can show a generic
   fallback string regardless.

**Acceptance criteria.**
- With the API forced to 500 (or offline) on first load, the dashboard shows the error state
  with a working **Try again**, and **never** shows $0.00 / 0% as if it were data.
- After a successful retry, the real figures render.
- A refetch error that occurs after data already loaded does not blank the page (keepPreviousData
  retains last-good values); at minimum it must not show $0.00.

**Verification.**
- Manually: throttle/oeblock `/api/summary` in devtools, load `/dashboard`, confirm error + retry.
- Add/extend a component test if the summary hook is mockable; otherwise rely on the `verify` skill
  to drive the real app.

**Risk.** Low. Pure additive branching; no data path changes. Watch that `keepPreviousData`
doesn't make `isError` + stale-data render both fire in a confusing way — prefer showing the
error state only when there is no usable data, and a subtle inline "couldn't refresh" affordance
when stale data exists (the latter can be deferred to the Follow-up refetch-indicator item).

---

## Item 2 — P1: Caption contrast (WCAG AA)

**Problem.** `--aurex-text-4` (#555867) is **2.61:1** on the card surface — fails AA (needs 4.5:1
for the 11px caption, and even fails the 3:1 large-text bar). It carries the KPI date-range line.
`--aurex-text-3` (#7d8090) passes at **4.69:1**.

**Files.**
- `components/data-card.tsx` (line ~71: the `dateRange` `<div className="text-[11px] ... text-[var(--aurex-text-4)] ...">`).

**Change.** Promote that caption from `--aurex-text-4` to `--aurex-text-3`. No size change needed.

**Acceptance criteria.**
- The KPI date-range caption renders at ≥4.5:1 against `#12141c`.
- No remaining **text** on the dashboard uses `--aurex-text-4` (it stays available only for
  non-text/decorative use, per DESIGN.md).

**Verification.** Recompute contrast (text-3 = 4.69:1, confirmed). Visual check that the caption
is legible.

**Risk.** Trivial.

**Note.** `--aurex-text-4` is used as **text** in ~8 other places outside the dashboard
(`app/(auth)/layout.tsx` footer, `transactions/import-*`, `transaction-form` optional labels,
`budgets-table` "No budget set", `insights/.../recurring-list`). Those are out of this spec's
scope but should get the same treatment — captured in Follow-ups as an `/impeccable audit` sweep.

---

## Item 3 — P2: Unify money typography on Geist Mono

**Problem.** The 3 KPI cards set figures in `font-mono ... tabular-nums` (Geist Mono); the Budget
and Insights cards directly below use `text-[28px] font-semibold tracking-tight tabular-nums`
(Geist **Sans**). Same data type, two typefaces, adjacent. Violates the Mono-Figure Rule.

**Files.**
- `components/budget-summary-card.tsx` (the `totalSpent` figure).
- `components/insights-teaser-card.tsx` (the `monthlyTotal` figure).

**Change.**
- Add `font-mono` to each primary money figure so it matches the KPI cards
  (`font-mono ... tabular-nums`). Keep `tabular-nums`.
- Keep the **secondary** inline text sans: Budget's ` / {totalBudgeted}` and Insights'
  `/mo recurring` are labels, not figures — leave them in Geist Sans (they read as captions).
  (Optional: the `/ {totalBudgeted}` denominator is itself a figure; if you want strict
  consistency, wrap just the number in `font-mono` and keep the "/" and "mo recurring" sans.)
- Recommended: align the figure size to the KPI scale (`text-[26px] sm:text-[30px]`) so the
  whole "this month" region shares one figure size. Optional — keeping 28/32 is acceptable if
  the teasers are being restructured in Item 4 anyway.

**Acceptance criteria.** Every primary money amount on the dashboard renders in Geist Mono with
`tabular-nums`; decimals align down a column where figures stack.

**Verification.** Visual diff; confirm no layout overflow (`break-all`/`line-clamp` already guard
the KPI value — apply the same guard if the teaser figures can grow large).

**Risk.** Low. Mono digits are slightly wider than Geist Sans; check the Budget
`{spent} / {budgeted}` line doesn't wrap awkwardly at narrow widths.

---

## Item 4 — P2 (judgment call): Differentiate the teaser cards

**Problem.** DataCard ×3 + BudgetSummaryCard + InsightsTeaserCard all use the same shell
(title + 40px tinted icon box top-right + big number + footer row). Five identical modules flatten
hierarchy; nothing signals the teasers differ in kind from the KPIs.

**This is the one item needing a design decision before building.** Two directions:

**Direction A (recommended) — Merge into one "This month" strip.**
- Replace the two-card grid (`page.tsx` lines 27–30) with a single full-width panel split by a
  vertical hairline (`--aurex-border`) into two regions: **Budget** (progress bar as its identity)
  and **Insights** (top-mover row + recurring total). One panel, two labeled regions, each with its
  own "Manage →" / "View →" link.
- Drops from 5 cards to **3 KPIs + 1 strip**, breaking the repeated-module rhythm decisively.
- Remove the 40px tinted icon box from these regions (that box is the KPI signature); let the
  progress bar and the trend row carry identity instead.
- Files: `app/(dashboard)/dashboard/page.tsx`, `components/budget-summary-card.tsx`,
  `components/insights-teaser-card.tsx` (refactor both into region components, or a new
  `components/this-month-strip.tsx` composing them).

**Direction B (lighter touch) — Keep two cards, strip the KPI signature.**
- Remove the top-right tinted icon box from both teasers so they stop mirroring the KPI cards.
- Give each a distinct identity: Budget = its progress bar (already present); Insights = a small
  sparkline or a compact top-mover list instead of a single big number.
- Files: `components/budget-summary-card.tsx`, `components/insights-teaser-card.tsx` only;
  `page.tsx` grid unchanged.

**Acceptance criteria.** A viewer can tell at a glance that the 3 KPIs are one set and the
budget/insights content is a different kind of element. No five-identical-card row.

**Risk.** Medium (visual). Direction A touches `page.tsx` composition and both card components;
Direction B is contained. Recommend confirming A vs B before building this item; Items 1–3 and 5
can ship without it.

---

## Item 5 — P3 (judgment call): Trim category-spend chart variants

**Problem.** "Top categories" offers pie / radar / radial. For "where the money is going,"
radar and radial add little decision value over a part-to-whole chart; the variety is a reflex.
(The cash-flow area/line/bar trio is more defensible and stays.)

**Files.**
- `components/spending-pie.tsx` (the `Select` options + the `chartType` branch).
- Possibly remove now-unused `components/radar-variant.tsx` and/or `components/radial-variant.tsx`
  plus their imports.

**Change — recommended:** Keep **pie** as the single default; remove the radar option. Decide on
radial:
- **Option 5a (focus):** pie only. Remove both radar and radial; delete `radar-variant.tsx` and
  `radial-variant.tsx` and their imports. Simplest, most focused.
- **Option 5b (preserve recent work):** keep pie + radial, drop radar only. A recent commit
  ("Fix dashboard category charts: distinct palette + radial geometry") just polished radial, so
  keeping it is defensible; drop only radar (weakest for magnitude comparison). Delete
  `radar-variant.tsx`.

Recommended: **5b** — drop radar, keep pie (default) + radial — since radial was just restyled and
gives a legitimate second read without the radar noise. If the toggle would be down to a single
option (5a), remove the `Select` entirely rather than leaving a one-item dropdown.

**Acceptance criteria.** Category spend shows a clear default with at most one alternative that
earns its place; no dead/unused variant components or imports remain.

**Risk.** Low, but it removes a user-facing option — confirm 5a vs 5b. If any e2e/test references
the removed option, update it.

---

## Suggested sequencing

1. **Item 2** (caption contrast) — trivial, ship first.
2. **Item 1** (error states) — highest trust value; the `DataError` component unblocks the rest.
3. **Item 3** (money mono) — small, independent.
4. **Item 5** (trim charts) — small; confirm 5a vs 5b.
5. **Item 4** (teaser differentiation) — largest; confirm Direction A vs B first.

Items 1–3 + 5 are a clean first PR (the P1s + low-risk P2/P3). Item 4 is a natural second PR once
the direction is chosen.

## Follow-ups (out of scope here, logged)

- `/impeccable audit` sweep of every `--aurex-text-4`-as-text usage site-wide (8 spots) for the
  same AA fix.
- Refetch pending indicator: a subtle "updating…" cue when a filter change refetches over existing
  data (`isFetching && !isLoading`).
- Power-user defaults: remember the date range and chart-type selection across visits.
- Nav grouping (7 → ≤5) if the working-memory concern is worth a global change.

## Mapping to impeccable commands (for the build phase)

- Item 1 → `/impeccable harden`
- Item 2 → `/impeccable audit`
- Item 3 → `/impeccable typeset`
- Item 4 → `/impeccable layout`
- Item 5 → `/impeccable distill`
- Final pass → `/impeccable polish`, then re-run `/impeccable critique dashboard` to confirm the
  score moved.
