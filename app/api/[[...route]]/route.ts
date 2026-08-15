import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { clerkMiddleware, getAuth } from '@clerk/hono';

import accounts from './accounts';
import budgets from './budgets';
import categories from './categories';
import insights from './insights';
import onboarding from './onboarding';
import transactions from './transactions';
import summary from './summary';
import plaid from './plaid';
import { apiBodyLimit } from '@/lib/api-body-limit';
import { reportApiRouteError } from '@/lib/observability';

export const runtime = 'nodejs';

// Default-deny: every API route requires a Clerk session unless explicitly
// listed here. The webhook authenticates itself via Plaid's signed JWT, and
// route modules keep their own requireAuth as defense-in-depth. A future route
// added without auth middleware is therefore still protected.
const PUBLIC_API_PATHS = new Set(['/api/plaid/webhook']);

const clerk = clerkMiddleware();

const app = new Hono()
  .basePath('/api')
  .use(apiBodyLimit)
  .use(async (c, next) => {
    if (PUBLIC_API_PATHS.has(c.req.path)) return next();
    return clerk(c, next);
  })
  .use(async (c, next) => {
    if (PUBLIC_API_PATHS.has(c.req.path)) return next();
    const auth = getAuth(c);
    if (!auth?.userId) return c.json({ error: 'Unauthorized' }, 401);
    await next();
  })
  .route('/accounts', accounts)
  .route('/budgets', budgets)
  .route('/categories', categories)
  .route('/insights', insights)
  .route('/onboarding', onboarding)
  .route('/transactions', transactions)
  .route('/summary', summary)
  .route('/plaid', plaid)
  .onError((err, c) => {
    reportApiRouteError(err, { method: c.req.method, path: c.req.path });
    if (process.env.NODE_ENV !== 'production') {
      console.error('[api error]', err);
    }
    return c.json({ error: 'Internal server error' }, 500);
  })
  .notFound((c) => c.json({ error: 'Not found' }, 404));

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);

export type AppType = typeof app;
