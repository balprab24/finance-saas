# Product

## Register

product

## Users

People managing their own money, not accountants by trade but serious about
knowing where it goes. They open Aurex to do a specific job: reconcile what came
in against what went out, categorize a batch of transactions, import a bank CSV,
or check whether this month's cash flow is healthy. The context is focused and
recurring, often a weekly or monthly review at a desk, sometimes a quick balance
check on a phone. They want the numbers to be exact and the path to them short.
The marketing landing serves a second audience: a prospective user deciding in
under a minute whether this workspace is trustworthy enough to hand their
financial data to.

## Product Purpose

Aurex is a personal-finance workspace for tracking accounts, categories, and
transactions, importing CSVs, and reading cash flow through a dashboard. It
exists so one person can see their complete financial picture, accurate to the
cent, without a spreadsheet's manual upkeep or a bank app's marketing clutter.
Success is the user trusting the totals enough to make decisions from them, and
finishing a categorize-or-reconcile session faster than they could anywhere else.
Money is stored as integer milliunits and every figure is shown exactly; the
product's credibility lives in that precision.

## Brand Personality

Composed, exact, document-grade. Three words: calm, precise, trustworthy. The
dominant feeling is **calm control**: money feels handled, the surface is quiet,
and the design earns trust through restraint rather than persuasion. The setting is
daylight — a near-white paper canvas with graphite ink, the way a careful printed
statement reads at a desk. The voice is plain and specific, never salesy. One
grotesque (Schibsted Grotesk) carries UI and headings through weight contrast, with
a mono (Geist Mono) for tabular figures; no serif. Color is disciplined to the
point of austerity: there is **no brand hue** — ink is the only action color — and
the only chroma in the product is green income / red expense / amber warning,
reserved strictly for financial meaning, never decoration.

## Anti-references

- The generic AI SaaS template: aurora blobs, gradient mesh backgrounds,
  glassmorphism cards, gradient-filled text, big-number hero-metric scaffolding,
  tiny uppercase tracked eyebrows above every section, Inter everywhere.
- **The dark-mode + indigo/violet + glow fintech default.** A near-black canvas
  with a single purple/indigo accent and soft glows is *the* saturated AI-SaaS
  look; Aurex deliberately runs the opposite — light, ink, flat, no glow.
- **The editorial-typographic lane.** Display serif (Fraunces / Newsreader and
  kin) + small mono labels + ruled separators + monochromatic dark restraint is a
  second-order AI default; the serif itself is the tell. Aurex uses a grotesque,
  not a serif.
- Bank and fintech marketing clutter: promotional banners, upsell tiles, reward
  badges, confetti, anything that competes with the user's own numbers.
- Crypto-dashboard maximalism: neon glow, candlestick drama, ticker noise,
  rainbow gradients signalling "finance."
- Navy-and-gold "premium banking" cliché and its terminal-green opposite.
- Decorative color: hues used for vibe rather than financial meaning.

## Design Principles

- **Precision is the brand.** Every figure exact to the cent; alignment, tabular
  numerals, and honest totals do more for trust than any styling. Never fake or
  round a number for visual neatness.
- **Calm by default, color on meaning.** The resting surface is calm near-white
  paper. Ink marks action and active state; green/red/amber mark financial state.
  There is no decorative brand hue — if a color isn't carrying income, expense,
  warning, or action, it shouldn't be there.
- **Restraint over template reflex.** Hierarchy comes from type scale, weight, and
  space, not from cards, glows, or gradients. When a pattern feels like the obvious
  AI move (dark canvas, a purple accent, a serif headline, a soft glow), choose the
  quieter, flatter one.
- **The shortest path to the number.** Dense finance workflows (filters, sortable
  tables, bulk actions, CSV mapping) should minimize clicks and never hide the
  data behind decoration.
- **Earn trust before asking for data.** On the marketing surface, show the real
  product and speak plainly; credibility is the conversion lever, not hype.

## Accessibility & Inclusion

Target WCAG 2.2 AA. Body text meets ≥4.5:1 against its background and large text
≥3:1; placeholder and muted text are held to the same body bar rather than the
default light gray. Every animation has a `prefers-reduced-motion: reduce`
alternative (the in-repo reveal/float/breathe motions already honor this).
Financial state is never communicated by color alone, since red/green is the
hardest pairing for color-blind users; pair income/expense color with sign,
label, or icon. Interactive elements are keyboard reachable with a visible focus
ring, and forms validate on both client and server with errors surfaced in text.