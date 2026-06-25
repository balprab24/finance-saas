# Light Counter — Ship Checklist

**Verdict (QA + Impeccable audit, updated 2026-06-08):** ship the Light Counter identity. It is
strong and intentional — a daylight account statement, finance-specific (statement
framing, In−Out=Net equation, ranked graphite ledger, legible chart), coherent across
routes, strong landing presence, no horizontal overflow at 1440/390/320. It is **not**
too austere. The incomplete reskin items from the original review have now been swept;
remaining work is product polish, not a redesign.

---

## P0 — blocking (finish the reskin: `features/` was missed)

13 residual OLD-palette hits in **5 files**, all under `features/` (the rest of the repo
is palette-clean). The lavender cadence badges on `/insights` are the visible symptom.

- [x] `features/insights/components/recurring-list.tsx` — **old accent badge**
      `bg-[rgba(99,102,241,0.12)] text-[#a5b4fc]` (line ~66) + `hover:text-[#fb7185]`.
- [x] `features/insights/components/trends-list.tsx` — `#fb7185` / `#34d399` + rgba tints.
- [x] `features/insights/components/unusual-list.tsx` — `#fbbf24` + `rgba(251,191,36,…)`.
- [x] `features/budgets/components/budgets-table.tsx` — `#fb7185` / `#34d399` + rgba tints.
- [x] `features/plaid/components/plaid-item-actions.tsx` — `rgba(251,191,36,0.16)`.

**Fix:** run the existing sweep scoped to `features/`:

```
#a5b4fc | #6366f1 | #7a7df7        -> #16181d
rgba(99,102,241,*)                 -> rgba(22,24,29,*)
#34d399                            -> #117a4b
#fb7185                            -> #c0392b
#fbbf24 | #f59e0b                  -> #b45309
rgba(52,211,153,*)                 -> rgba(17,122,75,*)
rgba(251,113,133,*)                -> rgba(192,57,43,*)
rgba(251,191,36,*)                 -> rgba(180,83,9,*)
bg-white/8 | bg-white/[0.x]        -> bg-black/[0.06] | bg-black/[0.05]
```

- [x] Hand-fix the recurring **cadence badge** to a neutral chip (graphite text on
      `--aurex-surface`) — a cadence is metadata, not a money/action color.
- [x] **A11y note:** this also resolves a real WCAG failure — `#34d399` as text on white
      is ~1.5:1 (fails AA); `#117a4b` passes. Verify the recolored green pills ≥4.5:1.

## P1 — taste / identity coherence

- [x] **Income amount color.** `app/(dashboard)/transactions/columns.tsx:82` renders income
      with `Badge variant="default"` (solid ink/black pill) and expense with
      `variant="destructive"` (red) — income loses its green meaning. Restore symmetry
      (income↔green, expense↔red). Confirm there's no deliberate "highlight positive"
      intent; if kept, document it as an exception. Check `accounts/columns.tsx` for the
      same pattern.
- [x] **Drop the per-page eyebrow + marketing headline.** Each route inlines a tiny
      uppercase tracked eyebrow + a tagline H1 — `transactions/page.tsx:82-86`
      (`TRANSACTIONS` / "Every dollar, accounted for"), budgets ("Set the limit, watch the
      spend"), insights ("Where the money actually goes"), accounts, categories, banks. The
      uppercase eyebrow is a named AI tell; marketing voice mismatches the product register.
      Use a plain functional H1 ("Transactions", "Budgets", "Insights") — one line, no eyebrow.

## P2 — polish (optional before ship)

- [x] Insights left column (recurring) leaves a tall empty gap beside the longer right
      column — balance the two-column rhythm (`app/(dashboard)/insights/page.tsx`).
- [ ] Transactions table clips/scrolls horizontally inside its card on mobile — dense but
      usable; consider a stacked/condensed mobile variant later.

## What's working (do not regress)

- Dashboard statement: net hero (proportional grotesque, tight figures) + In−Out=Net
  equation + cash-flow chart + graphite ledger. Finance-specific and intentional.
- Landing: real brand presence (bold headline + product preview) with no dark/indigo/glow.
- Tables (budgets/accounts) coherent; no overflow at 1440/390/320.
- Everything outside `features/` is Light Counter-clean.

## Screenshot QA (re-run after P0/P1)

- [x] `npm run build && npm run start`, then CDP capture: dashboard, transactions, budgets,
      insights, accounts, landing — desktop 1440 + mobile 390 + dashboard 320.
- [x] Recurring/trends/budget badges read graphite or green/red (no lavender); greens are
      the darker `#117a4b`.
- [x] `grep -rnE "#6366f1|#a5b4fc|#34d399|#fb7185|rgba\(99, ?102, ?241" app components features lib`
      returns nothing.
- [x] Re-confirm no horizontal overflow at 320.

## Suggested commit grouping (when cleared to commit)

1. `feat(ui): Light Counter identity — tokens, fonts, logo, header`
2. `style(ui): recolor components + charts to Light Counter`
3. `style(features): sweep features/ to Light Counter` (P0)
4. `style(ui): functional page titles + income=green badge` (P1)
5. `feat(marketing+auth): Light Counter landing + Clerk appearance`
6. `docs: PRODUCT.md + DESIGN.md to Light Counter; ship checklist`

## Constraints

- Do not further edit `components/marketing/preview-flow-chart.tsx` unless verification finds a bug.
- No API / schema / auth behavior changes — visual only.
- Pure git rollback (no data changes) if needed.
