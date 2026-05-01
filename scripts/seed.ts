import 'dotenv/config';
import { config } from 'dotenv';
import { format } from 'date-fns';

config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, inArray } from 'drizzle-orm';

import * as schema from '../db/schema';
import { buildDemoWorkspace } from '../lib/demo-data';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema });

const userId = process.argv[2];
if (!userId) {
  console.error('Usage: pnpm db:seed <clerk-user-id>');
  console.error('');
  console.error('To find your Clerk user id:');
  console.error('  1. Sign in at http://localhost:3000');
  console.error('  2. Open the Clerk dashboard at https://dashboard.clerk.com');
  console.error('  3. Navigate to Users; copy the id (it looks like user_xxxxx)');
  console.error('  4. Re-run this command with that id');
  process.exit(1);
}

if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PROD_SEED !== 'true') {
  console.error(
    'Refusing to seed: NODE_ENV=production. Set ALLOW_PROD_SEED=true to override.',
  );
  process.exit(1);
}

async function main() {
  console.log(`Seeding for user ${userId.slice(0, 6)}...`);

  const ownedAccounts = await db
    .select()
    .from(schema.accounts)
    .where(eq(schema.accounts.userId, userId));
  const ownedCategories = await db
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.userId, userId));
  const ownedAccountIds = ownedAccounts.map((a) => a.id);
  if (ownedAccountIds.length > 0) {
    await db
      .delete(schema.transactions)
      .where(inArray(schema.transactions.accountId, ownedAccountIds));
  }
  await db.delete(schema.accounts).where(eq(schema.accounts.userId, userId));
  await db.delete(schema.categories).where(eq(schema.categories.userId, userId));
  console.log(`  cleared ${ownedAccounts.length} accounts, ${ownedCategories.length} categories`);

  const demo = buildDemoWorkspace(userId);
  await db.insert(schema.accounts).values(demo.accounts);
  console.log(`  inserted ${demo.accounts.length} accounts`);

  await db.insert(schema.categories).values(demo.categories);
  console.log(`  inserted ${demo.categories.length} categories`);

  if (demo.transactions.length > 0) {
    await db.insert(schema.transactions).values(demo.transactions);
  }
  const firstTransaction = demo.transactions[0]?.date ?? new Date();
  const lastTransaction = demo.transactions.at(-1)?.date ?? new Date();
  console.log(
    `  inserted ${demo.transactions.length} transactions across ${format(firstTransaction, 'MMM dd')} - ${format(lastTransaction, 'MMM dd')}`,
  );
  console.log('');
  console.log('Done. Reload http://localhost:3000 to see the populated dashboard.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => client.end());
