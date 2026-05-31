import { Hono } from 'hono';
import { handle } from 'hono/vercel';

import accounts from './accounts';
import categories from './categories';
import onboarding from './onboarding';
import transactions from './transactions';
import summary from './summary';
import plaid from './plaid';

export const runtime = 'nodejs';

const app = new Hono()
  .basePath('/api')
  .route('/accounts', accounts)
  .route('/categories', categories)
  .route('/onboarding', onboarding)
  .route('/transactions', transactions)
  .route('/summary', summary)
  .route('/plaid', plaid)
  .onError((err, c) => {
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
