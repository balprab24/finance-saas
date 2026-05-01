# Finance SaaS — Agent Reference

## What this is

Personal-finance SaaS for tracking accounts, categories, and transactions with an interactive dashboard and CSV import. Built as a portfolio project; designed to be deployable to Vercel.

## Stack

- **Next.js 15 (App Router)** — full-stack framework, hosts pages and API
- **React 19** + **TypeScript**
- **Tailwind v4** + **shadcn/ui** (radix-nova style) — components are owned in-repo under `components/ui/`
- **Clerk** (`@clerk/nextjs`) — auth; middleware-protected pages and API
- **Hono** mounted at `app/api/[[...route]]/route.ts` — typed RPC server
- **Drizzle ORM** + **better-sqlite3** locally (production target: Postgres on Neon — schemas use `pgTable` semantics that swap cleanly via `drizzle-kit`)
- **TanStack Query (React Query)** — server-state cache on the client
- **Hono RPC client** — fully typed, exported from `lib/hono.ts`
- **react-hook-form** + **zod** + `drizzle-zod` — same schema validates client + server
- **Recharts** — dashboard charts
- **papaparse** — CSV parsing in the browser

## Folder conventions

```
app/
  (auth)/sign-in, sign-up         Clerk pages
  (dashboard)/                    protected app shell
    layout.tsx                    header + nav + footer
    page.tsx                      dashboard with charts
    accounts/page.tsx             CRUD page per resource
    categories/page.tsx
    transactions/page.tsx         CRUD + import flow
  api/[[...route]]/route.ts       Hono mount point
db/
  schema.ts                       Drizzle tables + drizzle-zod schemas
  drizzle.ts                      DB client export
features/<resource>/
  api/use-get-<thing>.ts          React Query hook
  api/use-create-<thing>.ts       useMutation with cache invalidation
  components/<thing>-form.tsx     rhf + zod form
  components/new-<thing>-sheet.tsx
  components/edit-<thing>-sheet.tsx
  hooks/use-new-<thing>.ts        zustand store for sheet open/close
hono/                             route files mounted by app/api/[[...route]]/route.ts
lib/
  hono.ts                         RPC client (typed from server export)
  utils.ts                        cn() etc.
providers/
  query-provider.tsx              QueryClientProvider wrapper
  sheet-provider.tsx              renders all <NewXSheet/> globally
components/ui/                    shadcn primitives
```

## Non-negotiable rules

1. **Money is stored in cents (integer).** Never use floats for currency. Negative amounts are expenses, positive are income. Format as dollars at display time only.
2. **Every API handler filters by `auth.userId`.** Multi-tenant isolation is the most important security invariant. Use `and(eq(table.userId, auth.userId), eq(table.id, id))` in every query.
3. **All CRUD passes through Hono.** No direct DB calls from React Server Components — keep the API as the single boundary so RPC types stay coherent.
4. **Validate twice.** Zod on the client (rhf) AND server (`@hono/zod-validator`). Same schema source.
5. **No secrets in the repo.** `.env.local` is gitignored. Only place secrets there. Never log full tokens; `console.log` only `userId.slice(0, 6)` if debugging.
6. **`"use client"` belongs on interactive components.** Pages are server by default; forms, hooks, charts, anything calling React Query → client.
7. **Cache invalidation key matches query key.** `useCreateAccount` → `queryClient.invalidateQueries({ queryKey: ['accounts'] })` to match `useGetAccounts`.

## Patterns

**API route file** (e.g. `hono/routes/accounts.ts`)
```ts
const app = new Hono()
  .get('/', clerkMiddleware(), async (c) => {
    const auth = getAuth(c)
    if (!auth?.userId) return c.json({ error: 'Unauthorized' }, 401)
    const data = await db.select().from(accounts).where(eq(accounts.userId, auth.userId))
    return c.json({ data })
  })
  .post('/', clerkMiddleware(), zValidator('json', insertAccountSchema.pick({ name: true })), async (c) => { ... })
```

**React Query hook** (e.g. `features/accounts/api/use-get-accounts.ts`)
```ts
export const useGetAccounts = () => useQuery({
  queryKey: ['accounts'],
  queryFn: async () => {
    const res = await client.api.accounts.$get()
    if (!res.ok) throw new Error('Failed')
    const { data } = await res.json()
    return data
  },
})
```

## Useful commands

```bash
pnpm dev              # next dev (http://localhost:3000)
pnpm db:generate      # drizzle-kit generate
pnpm db:migrate       # apply migrations to local sqlite
pnpm db:studio        # browse local DB
pnpm screenshot <url> # take a PNG via playwright
```

## SQLite vs Postgres swap

We use SQLite locally for fast iteration. To swap to Postgres on Neon:
1. Replace `better-sqlite3` import in `db/drizzle.ts` with `@neondatabase/serverless`
2. Change `sqliteTable` → `pgTable` in `db/schema.ts` (column types: `integer` → `integer`, `text` → `text`, dates → `timestamp`)
3. Update `drizzle.config.ts` `dialect: 'sqlite' → 'postgresql'`
4. `pnpm db:generate && pnpm db:migrate`

The application code (Hono routes, React hooks, components) is identical for both.
