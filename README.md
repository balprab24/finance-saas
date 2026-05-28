# Finance SaaS

A full-stack personal finance dashboard for tracking accounts, categories, and transactions. The app includes Clerk authentication, typed Hono API routes, Drizzle/Postgres persistence, CSV import helpers, and dashboard charts for income, expenses, remaining balance, and category spend.

## Features

- Authenticated dashboard powered by Clerk
- Account, category, and transaction CRUD
- Bulk transaction import from CSV
- Date and account filters for reports
- Summary cards and charts built with Recharts
- Tenant-scoped API queries using the signed-in Clerk user id
- Server and client validation with Zod and Drizzle schemas
- Drizzle migrations for PostgreSQL

## Tech Stack

- Next.js 15 App Router
- React 19 and TypeScript
- Tailwind CSS v4 and shadcn-style local UI components
- Clerk for authentication
- Hono for typed API routes under `/api`
- Drizzle ORM with PostgreSQL
- TanStack Query for client data fetching
- React Hook Form, Zod, and drizzle-zod for forms and validation
- Vitest for focused unit/API tests

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local env file:

```bash
cp .env.example .env.local
```

If `.env.example` is not present, create `.env.local` with these variable names and fill in your own local values:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
DATABASE_URL=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Local database with Docker

The fastest path to a local Postgres matching what the app expects is the bundled `docker-compose.yml`:

```bash
docker compose up -d db
```

This starts Postgres 16 on `localhost:5432` with the default `postgres` database, user `postgres`, password `postgres`. Set the matching `DATABASE_URL` in your `.env.local`:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
```

Any other Postgres (Neon, Supabase, RDS, a system-installed daemon, `brew install postgresql@16`) works just as well — Docker is just the simplest local path. Just point `DATABASE_URL` at it.

Run database migrations:

```bash
npm run db:migrate
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev          # Start the Next.js dev server
npm run build        # Build for production
npm run start        # Start the production server
npm run lint         # Run Next linting
npm run test         # Run Vitest tests
npm run db:generate  # Generate Drizzle migrations
npm run db:migrate   # Apply Drizzle migrations
npm run db:push      # Push schema changes
npm run db:studio    # Open Drizzle Studio
npm run db:seed      # Seed demo data for one Clerk user id
npm run screenshot      # Capture a public/local page screenshot
npm run screenshot:auth # Capture authenticated QA screenshots via Chrome CDP
```

Seed data for a specific Clerk user:

```bash
npm run db:seed -- user_xxxxxxxxx
```

The seed script is scoped to the provided user id and refuses production seeding unless explicitly overridden.

## Project Structure

```text
app/
  (auth)/                 Clerk sign-in and sign-up pages
  (dashboard)/            Protected dashboard routes
  api/[[...route]]/       Hono route handlers
components/               Shared dashboard and UI components
db/                       Drizzle schema and database client
drizzle/                  Generated migrations and snapshots
features/                 Resource-specific API hooks, forms, and sheets
hooks/                    Shared React hooks
lib/                      Utilities, typed Hono client, date/CSV helpers
providers/                Query and sheet providers
scripts/                  Seed and screenshot helpers
```

## Authenticated visual QA

Clerk's Google OAuth flow refuses to complete inside a fresh Playwright
Chromium build, which blocks `scripts/screenshot.ts --login` for any account
that signs in via Google. The supported path is to attach Playwright to a
real Chrome that you have already signed in to, over the Chrome DevTools
Protocol.

```bash
# 1. Fully quit Chrome.
# 2. Launch Chrome with the debug port open:
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

# 3. In that Chrome window, open the app and sign in once:
#      http://localhost:3000/sign-in
#    Leave the window open after sign-in completes.

# 4. Make sure the dev server and a seeded database are up:
npm run dev
npm run db:seed -- <your_clerk_user_id>   # optional, populates demo data

# 5. Capture all required authenticated screenshots into screenshots/auth/:
npm run screenshot:auth

# Or scope to one scenario:
npm run screenshot:auth -- dashboard-desktop
npm run screenshot:auth -- --list
```

Scenario keys produced under `screenshots/auth/`:

- `dashboard-desktop.png`, `dashboard-mobile.png`
- `transactions-desktop.png`, `transactions-mobile.png`
- `accounts-desktop.png`, `accounts-mobile.png`
- `categories-desktop.png`, `categories-mobile.png`
- `transaction-new-sheet.png`
- `transaction-edit-sheet.png` (requires at least one seeded transaction)
- `csv-import-map.png`
- `csv-import-review.png` (driven by `scripts/fixtures/import-sample.csv`,
  which intentionally contains an unparseable-date row, a missing-payee
  row, and one duplicate row)

The script disconnects from Chrome rather than closing it, so your real
browser session stays intact. If you see `The attached Chrome is NOT
signed in`, complete sign-in in the CDP-attached Chrome window and re-run.

If automation is unavailable, capture the same filenames manually by
opening each URL in a 1440x900 (desktop) or 390x844 (mobile) window and
saving full-page screenshots into `screenshots/auth/` using the keys
above.

### Caveats

- **macOS Chrome and the debug port.** On recent Chrome builds
  `--remote-debugging-port=9222` silently fails to bind unless Chrome
  also gets a fresh `--user-data-dir`. If `curl -s
  http://localhost:9222/json/version` returns nothing after launch, fully
  quit Chrome and relaunch with:

  ```bash
  /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
    --remote-debugging-port=9222 \
    --user-data-dir="$HOME/Library/Application Support/Google/Chrome-CDP" \
    --no-first-run --no-default-browser-check
  ```

  That's an isolated profile, so sign in to Clerk once in that window
  before running `npm run screenshot:auth`.

- **Recharts 3 / Playwright fullPage artifact.** The chart areas of
  `dashboard-desktop.png` and `dashboard-mobile.png` may show titles,
  legends, axis labels, and grid lines but not the actual area/line/pie
  paths. This is a Recharts 3.x `ResponsiveContainer` interaction with
  Chrome's `captureBeyondViewport` mode — element-clip screenshots and
  any real browser session render the charts correctly. Not a runtime UI
  bug.

- **The "N" overlay is dev-only.** The small black circle with an "N"
  near the bottom-left of every screenshot is the Next.js dev-mode
  indicator. It is not present in `npm run build && npm run start`
  output.

## Security Notes

- Do not commit `.env.local` or real credentials.
- `.env`, `.env*.local`, local database files, screenshots, and auth artifacts are gitignored.
- `NEXT_PUBLIC_*` values are browser-visible by design; keep secrets in server-only variables such as `CLERK_SECRET_KEY` and `DATABASE_URL`.
- API routes scope database access to `auth.userId` so one user cannot read or mutate another user's data.
