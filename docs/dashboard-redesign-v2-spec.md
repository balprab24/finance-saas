# Dashboard Redesign v2 — "The Statement" (Direction A)

## Context

The `/dashboard` was visually grounded (fresh authenticated screenshots, desktop +
mobile) and critiqued under Impeccable. Verdict: the lower half (`statement-section`
+ `category-ledger` ruled "Where it went" ledger) is genuinely on-brand and
distinctive; the upper half (eyebrow + greeting + a row of three identical KPI cards
with tinted icon boxes and trend pills) is the textbook dark-SaaS hero-metric
template that PRODUCT.md lists as an anti-reference — and DESIGN.md currently
*canonizes* it as the "Signature Component." The page is two design languages
stitched together, template on top.

Direction A rebuilds the whole dashboard as **one financial statement**: zero cards,
a single ruled sheet — masthead → stated cash position (the In − Out = Net equation)
→ ruled Cash-flow / Where-it-went grid → a quiet This-month footer. It extends the
already-proven statement components (lowest risk) and fixes every P0/P1 from the
critique. One idea is folded in from Direction B: the In/Out/Net figures link into
their transactions.

Outcome: the first screen reads as an exact, authoritative financial document, not a
SaaS widget grid; the centerpiece chart stops rendering blank; hero figures stop
showing the monospace-punctuation gap bug; expense-trend color stops being
semantically inverted.

## Critique issues this resolves (Phase 1 IDs)

P0 #3 blank chart · P1 #1 template KPI cards · #2 mono-hero-figure bug · #4 eyebrow ·
#5 greeting filler · #6 inverted expense color · #7 two design languages · P2 #8
invisible arithmetic · #9 date repeated 5× · #11 bolted-on filters · #12 mobile empty
chart · #13 missing trust cues · P3 #14 figures are dead ends · #15 ambiguous
"Remaining".

(Out of default scope, tracked separately: #10 nav grouping — included as a small
secondary task; can be dropped without affecting the redesign.)

---

## Layout: before → after

**Before** (`app/(dashboard)/dashboard/page.tsx`):
```
[ WelcomeMsg (eyebrow + greeting + subtitle) ]   [ Filters (2 floating pills) ]
[ DataGrid: 3 KPI cards w/ icon boxes + pills ]
[ ThisMonthStrip: rounded panel, Budget | Insights ]
[ DataCharts: rounded frame, Cash flow | Where it went ]
```

**After** — one statement sheet (single `aurex-card`, `p-0`, internal hairlines):
```
┌ STATEMENT SHEET ───────────────────────────────────────────────┐
│ Masthead:  "Statement"        AllAccounts▾  Period▾   as of …    │  border-b
│ Cash position:  Net this period          ↑+42% (good=green)      │  border-b
│                 $7,787.56  ← Fraunces (serif), tabular           │
│                 In $8,408.37 − Out $620.81 = Net $7,787.56       │  mono ≤15px, links
├──────────────────────────────┬─────────────────────────────────┤
│ Cash flow      <period once>  │ Where it went                   │  divide-x
│ [fixed line chart, real axis] │ ranked ledger (unchanged)       │
├──────────────────────────────┴─────────────────────────────────┤
│ This month:  Budget $0/$34 ───  ·  Recurring $182/mo  · top mvr │  border-t, demoted
└─────────────────────────────────────────────────────────────────┘
```
Global `Header` (logo + nav + UserButton) is untouched above the sheet. Period is
stated once in the masthead; per-section captions drop the redundant date.

---

## Exact files to change

### Add
- **`components/statement-masthead.tsx`** — left: "Statement" / period title; right:
  `AccountFilter` + `DateFilter` composed inline + a faint "as of {time}" trust line.
  Replaces `WelcomeMsg` + `Filters` row. No eyebrow, no greeting.
- **`components/cash-position.tsx`** — replaces `DataGrid`/`DataCard`. Reads
  `useGetSummary`. Renders: label "Net this period"; net figure `data.remainingAmount`
  in `font-display` (Fraunces) `tabular-nums`, clamp ~40–52px (≤ display ceiling); a
  good/bad trend mark from `remainingChange`; the equation line
  `In {income} − Out {expenses} = Net {remaining}` in `font-mono` ~14–15px tabular.
  In/Out/Net are `<Link>`s to `/transactions?{from,to,accountId}`. Owns its loading
  skeleton + retryable `DataError` (mirror current `DataGrid` first-load-error rule:
  never fabricate $0.00).
- **`components/statement-sheet.tsx`** (optional thin wrapper) — the outer `aurex-card
  p-0 overflow-hidden` frame; or compose inline in `page.tsx`. Pick one, keep DRY.

### Change
- **`app/(dashboard)/dashboard/page.tsx`** — compose the single sheet:
  `Masthead → CashPosition → (CashFlow | WhereItWent) → ThisMonthStrip`, all inside
  one frame separated by rules. Preserve the `showEmptyState → DashboardEmptyState`
  branch.
- **`components/cash-flow-figure.tsx`** — fix the blank chart:
  - Y axis: replace `domain={[0,'auto']}` with a computed "nice" max from the data
    (max of per-day income/expenses, padded ~10%, rounded up), explicit `tickCount`.
  - Lines: `strokeWidth` 2 → ~2.5; add a faint same-hue fill so a near-flat line
    still reads (no gradient — brand ban). Keep income green / expense rose + legend.
  - All-zero guard: if every day's income+expenses === 0, render the in-section empty
    state instead of an axis with no line.
- **`components/this-month-strip.tsx`** — demote from its own rounded panel to a ruled
  footer section of the sheet (drop the outer `aurex-card`; keep the Budget | Insights
  split via internal divide). Keep its per-region loading/error.
- **`components/data-charts.tsx`** — becomes the middle grid *inside* the sheet (it is
  already a hairline-divided frame); strip its outer `aurex-card`, drop the duplicated
  period caption (masthead owns it), keep the empty/error logic.
- **`components/loading-skeletons.tsx` → `DashboardSkeleton`** — reshape to the single
  sheet geometry (masthead bar → net block → chart+ledger grid → footer line) so the
  `loading.tsx` boundary doesn't reflow when data lands.
- **`components/filters.tsx`** — recomposed into the masthead (or removed if the
  masthead owns `AccountFilter`/`DateFilter` directly).
- **`app/globals.css`** — dashboard-specific tokens/helpers only:
  - Add `--aurex-rule: rgba(255,255,255,0.09)` for major statement section rules
    (between inner `--aurex-border` 0.07 and `--aurex-border-strong` 0.12). Optional.
  - Optional, conservative: warm `--aurex-bg` a hair toward dark paper — **default:
    leave as-is** (it's global to all routes; only change if visually verified safe).
- **`DESIGN.md`** — rewrite to match reality (explicitly permitted):
  - Replace "Signature Component — KPI Data Card" (icon box + trend pill) with the
    **Cash Position** statement block + the ledger as the signatures.
  - Amend the "Mono-Figure Rule" → **figure-size rule**: Geist Mono for figures ≤18px
    (tables, columns, the equation); Fraunces for hero figures >24px (avoids the
    monospace punctuation-gap at display size). Keep tabular alignment for both.
  - Remove the icon-box / card-row from the canonical vocabulary.

### Delete
- **`components/data-card.tsx`** (cards + `boxVariant`/`iconVariant` tinted boxes).
- **`components/data-grid.tsx`** (replaced by `cash-position.tsx`).
- **`components/welcome-msg.tsx`** (eyebrow + greeting; replaced by masthead).

### Keep (the model — do not regress)
`components/statement-section.tsx`, `components/category-ledger.tsx`,
`components/data-error.tsx`, `account-filter.tsx`, `date-filter.tsx`.

### Secondary (P2, droppable): nav grouping
`components/navigation.tsx` — group 7 items to ≤5 primary (Overview, Transactions,
Accounts, Categories) with Banks/Budgets/Insights in an overflow "More" or second
tier; resolves critique #10 and the Accounts/Banks confusion.

## Do NOT touch
API behavior & `app/api/[[...route]]/summary.ts`; DB/schema/migrations; auth/Clerk/
`middleware.ts`; `PRODUCT.md`; marketing files incl. `components/marketing/
preview-flow-chart.tsx`; the `force-dynamic` export on the dashboard layout (keep).

## Token changes (summary)
- Remove: `boxVariant`/`iconVariant` (deleted with `data-card.tsx`).
- Add: `--aurex-rule` (optional).
- Figure typography: serif hero (`font-display`) vs mono columns (`font-mono ≤18px`).
- Trend color = good/bad semantics, not raw sign: for **expenses**, a decrease is
  green / increase is rose; for income & net, increase green / decrease rose. Always
  paired with an arrow + sign (color never alone).

## Mobile acceptance criteria (≤390px; spot-check 320px)
- No horizontal overflow: `scrollWidth <= clientWidth` on `/dashboard`.
- Sheet sections stack with horizontal rules (`divide-y`), not vertical.
- Masthead controls go full-width, stacked; period stated once.
- Net figure + equation legible; equation may wrap to stacked In / Out / Net lines.
- Cash-flow chart height reduced (~200–220px) and never blank (clamped axis); no-data
  → empty state.
- Ledger names truncate; amounts never wrap.
- Filter controls & figure links ≥44×44px touch targets.

## Loading / error / empty criteria
- `DashboardSkeleton` matches the new single-sheet geometry (no reflow on data land).
- Each data section keeps its own retryable `DataError` when its query errors with no
  cached data; figures never fabricate `$0.00` on first-load error.
- Empty workspace → existing `DashboardEmptyState` onboarding path preserved.
- Cash-flow all-zero / no transactions in period → in-section empty state, not a bare
  axis.

## Screenshot QA checklist
- `npm run screenshot:auth -- dashboard` (desktop 1440 + mobile 390), success state.
- Capture loading (first load / throttle), empty (no-tx period or new workspace),
  error (offline) states.
- Verify: no eyebrow, no greeting, no icon-box cards; net figure (serif) renders
  commas/periods cleanly with no monospace gaps; equation (mono) aligns; chart shows
  visible income+expense lines with a readable Y axis; ledger unchanged; period label
  appears once; expense decrease reads green.
- Confirm no horizontal scrollbar at both breakpoints.

## Rollback plan
All work stays on `ui/editorial-restyle` in discrete commits. No DB/API/migration
changes, so rollback is pure git: `git revert` the redesign commit(s), or restore the
deleted files (`data-card.tsx`, `data-grid.tsx`, `welcome-msg.tsx`) and the previous
`page.tsx`/`data-charts.tsx`/`this-month-strip.tsx` from history, and revert the
`DESIGN.md` and `globals.css` diffs. Old components remain recoverable in git history.

## Verification (after implementation)
1. `npm run lint`
2. `npx tsc --noEmit` (and/or `npm run build`)
3. `npm test` (vitest — confirm no dashboard/component regressions; landing e2e
   untouched)
4. `npm run screenshot:auth -- dashboard` desktop + mobile; visual review per the QA
   checklist
5. Confirm no horizontal overflow; confirm success / loading / empty / first-load
   error states all behave
