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

## Security Notes

- Do not commit `.env.local` or real credentials.
- `.env`, `.env*.local`, local database files, screenshots, and auth artifacts are gitignored.
- `NEXT_PUBLIC_*` values are browser-visible by design; keep secrets in server-only variables such as `CLERK_SECRET_KEY` and `DATABASE_URL`.
- API routes scope database access to `auth.userId` so one user cannot read or mutate another user's data.
