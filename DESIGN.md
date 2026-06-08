---
name: Aurex
description: A personal-finance workspace where precision is the aesthetic — a printed account statement, in daylight.
colors:
  ink: "#16181d"
  ink-2: "#3a414b"
  ink-3: "#5b6470"
  ink-4: "#8a9099"
  paper: "#f5f6f7"
  surface: "#ffffff"
  hairline: "rgba(0,0,0,0.08)"
  rule: "rgba(0,0,0,0.10)"
  bar: "#2b2f36"
  income-green: "#117a4b"
  expense-red: "#c0392b"
  warn-amber: "#b45309"
typography:
  display:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "clamp(2rem, 2vw + 1.25rem, 4.375rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  heading:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "clamp(1.375rem, 1vw + 1rem, 1.625rem)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  figure-hero:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 1.5vw + 2rem, 3.25rem)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "tabular-nums"
  figure:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.01em"
    fontFeature: "tabular-nums"
  label:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.1em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  pill: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    height: "32px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    border: "1px solid {colors.hairline}"
    rounded: "{rounded.lg}"
    height: "32px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.hairline}"
    rounded: "{rounded.md}"
    padding: "20px"
  input:
    backgroundColor: "rgba(0,0,0,0.025)"
    textColor: "{colors.ink}"
    border: "1px solid {colors.hairline}"
    rounded: "{rounded.lg}"
    height: "40px"
---

# Design System: Aurex

## 1. Overview

**Creative North Star: "The Counter, in Daylight"**

Aurex is a printed account statement reimagined for a screen: exact figures, hairline
rules, graphite ink on near-white paper. Precision is not a feature, it is the
aesthetic. The interface earns trust the way a well-kept statement does — legible,
exact, and quiet — and nothing competes with the user's own numbers.

The system is **light by default** because the work is a focused desk task in daylight:
a weekly or monthly reconcile where the numbers should read like ink on paper, not
glow on glass. Hierarchy comes from type (one grotesque in contrasting weights, with a
mono for figures), from generous space, and from hairline rules. There is **no brand
color**: ink carries action and active state, and the only chroma in the product is the
money palette — green income, red expense, amber warning.

What this system rejects, deliberately, is the look it used to have: the dark-canvas +
indigo-accent + soft-glow fintech-SaaS default, and the editorial-typographic lane
(display serif + mono labels + ruled separators on dark). Both are saturated AI
defaults. Aurex is light, inked, flat, and serif-free. No aurora, no glassmorphism, no
gradient text, no glow, no purple.

**Key Characteristics:**
- Graphite ink on near-white paper; white panels separated by dark hairlines.
- One grotesque (Schibsted Grotesk) for everything; Geist Mono for tabular figures.
- No brand hue — ink is the only action color; color elsewhere means money.
- Flat surfaces, hairline rules, zero glow / blur / gradient.
- Calm control: low visual noise, restraint read as sophistication.

## 2. Colors

A near-monochrome paper palette so the money hues are the only color on screen.

### Neutral (the whole UI lives here)
- **Ink** (#16181d): primary text, headings, the action color (primary buttons, active
  state, focus). ~14:1 on paper.
- **Ink 2** (#3a414b): body copy.
- **Ink 3** (#5b6470): muted labels, captions — held at ≥4.5:1 on white.
- **Ink 4** (#8a9099): faint metadata only, never body.
- **Paper** (#f5f6f7): the app canvas. **Surface** (#ffffff): cards, sheets, panels.
- **Hairline** (rgba 0,0,0,0.08) / **Rule** (0.10) / **Strong** (0.14): borders and the
  dividers between statement sections.
- **Bar** (#2b2f36): the ledger magnitude bar — graphite, length carries the value.

### Money (the only chroma, never decorative)
- **Income Green** (#117a4b): positive amounts, up-trend. AA on white.
- **Expense Red** (#c0392b): negative amounts, down-trend, destructive. AA on white.
- **Warn Amber** (#b45309): warnings, budget caution.

### Named Rules
**The No-Brand-Hue Rule.** There is no indigo, no accent color. Action and active state
are **ink**. Its weight (a near-black on paper) is what reads as "act here." Adding a
brand color back is the single fastest way to drift toward the old AI-SaaS look.

**The Color-Means-Money Rule.** Green, red, and amber are financial signals, never
styling. Pair every income/expense color with a sign, label, or icon; red/green alone
fails color-blind users.

## 3. Typography

**Display / Body Font:** Schibsted Grotesk (system-ui, sans-serif fallback).
**Figure / Mono Font:** Geist Mono (ui-monospace fallback).

**Character:** one grotesque carries the entire interface — headings, UI, body — through
weight contrast (400 body, 600 headings/figures). It is plain and form-like, the voice
of a statement, not a magazine. **No serif** (the serif headline is a saturated AI
default). A mono sets figures so digits align down a column.

### Hierarchy
- **Display** (Schibsted Grotesk 600, clamp 32→70px): hero headline on the landing.
- **Heading** (600, 22→26px): page and section headings.
- **Hero figure** (Schibsted Grotesk 600, 40→52px, tabular-nums): the lead money figure
  (the net cash position). Set in the grotesque, not mono — at display size a monospace
  opens distracting gaps around the comma and decimal.
- **Figure** (Geist Mono 600, ≤18px, tabular-nums): in-context amounts — ledger rows,
  tables, the In − Out = Net equation. Mono where digits must align in a column.
- **Body** (400, 15–17px, leading 1.6): paragraphs, capped 65–75ch.
- **Label** (600, 11–13px, tracking 0.1em, uppercase): short kickers, column headers.

### Named Rules
**The Figure-Size Rule.** Money sizing is split by typeface: Geist Mono for amounts
≤18px (so columns align), the grotesque for the single hero figure >24px (so punctuation
stays tight). Both are tabular.

**The No-Serif Rule.** Headings are the grotesque, not a serif. The serif headline +
mono-label + ruled-separator combination is the editorial-typographic AI lane; Aurex
makes hierarchy with weight and space instead.

## 4. Elevation

Flat by default. A white panel (#ffffff) sits on paper (#f5f6f7), separated by a single
dark hairline — not a shadow. Depth is the tonal step plus the rule, never a glow.
Shadows appear only where something genuinely floats (the marketing preview card, overlay
menus), and they are soft and neutral, never colored, never a glow.

### Named Rules
**The Flat-By-Default Rule.** In-app surfaces (`aurex-card`) are flat with a hairline at
rest. Hover strengthens the border; it never adds a shadow or glow. No `backdrop-blur`.

## 5. Components

### Buttons
- **Primary:** Ink (#16181d) fill, white text, 32px in-app (the marketing CTA grows to
  44px). Hover lifts to #2b2f36. No glow.
- **Ghost / Outline:** transparent, ink text, hairline border that strengthens on hover.
- **Destructive:** red tint (rgba 192,57,43,.1) with Expense Red text, never a solid red.

### Cards / Containers
- White (#ffffff) on paper, hairline border, 8–12px radius, no shadow at rest. Nested
  cards are forbidden. The dashboard is one sheet divided by rules, not a stack of boxes.

### Inputs / Fields
- 40px tall (in-app controls 32px), faint fill (rgba 0,0,0,.025), hairline border.
  Focus shifts the border to ink with a thin ink ring. Placeholder at Ink-3 contrast.

### Navigation
- A row of text links (Ink-3 idle, Ink-1 active on a faint fill) on desktop; a left sheet
  on ≤1024px with an ink dot marking the active route (no glow). Sticky header is solid
  white with a bottom hairline — no blur, no gradient.

### Logo
- A solid **ink** rounded-square badge with a white "A" monogram. No color fill, no glow.

### Signature surface — The Statement
The dashboard is one ruled statement sheet (a single white card divided by `rule`
hairlines), with two signature blocks:
- **Cash Position:** "Net this period" label, the net figure in the **grotesque** at
  40→52px tabular, a directional trend (arrow + signed %, green up / red down — good vs
  bad, not raw sign), then the arithmetic shown as an `In − Out = Net` equation in Geist
  Mono. A "View transactions" link makes the position a door to the rows behind it.
- **Category Ledger** ("Where it went"): ranked rows, each a label with a right-aligned
  Geist Mono amount and a single graphite magnitude bar, closed by a ruled Total.

## 6. Do's and Don'ts

### Do:
- **Do** keep the canvas light: graphite ink on near-white paper, white panels, dark
  hairlines.
- **Do** make action and active state **ink** — there is no brand hue.
- **Do** size money by the Figure-Size Rule (mono ≤18px, grotesque hero >24px), tabular.
- **Do** keep surfaces flat: hairline borders and the paper→white tonal step, no shadow
  at rest.
- **Do** pair income/expense color with a sign, label, or icon, and hold body/muted text
  to ≥4.5:1.
- **Do** give every motion a `prefers-reduced-motion: reduce` fallback.

### Don't:
- **Don't** reintroduce a dark canvas, an indigo/violet accent, or any glow — that is the
  exact AI-SaaS look this system was rebuilt to escape.
- **Don't** use a serif for headings, or the serif + mono-label + ruled-separator
  editorial lane. Headings are the grotesque.
- **Don't** use aurora blobs, gradient-mesh backgrounds, glassmorphism, gradient-filled
  text, or `backdrop-blur`.
- **Don't** use color decoratively. If a hue isn't income, expense, warning, or action,
  remove it.
- **Don't** nest cards, add a colored border-stripe accent, or give resting surfaces a
  drop shadow.
- **Don't** round, pad, or fake a number for visual neatness. Precision is the brand.
