import 'dotenv/config';
import { config } from 'dotenv';
import { format } from 'date-fns';

config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';

import * as schema from '../db/schema';
import { buildDemoWorkspace } from '../lib/demo-data';
import { resolveDbOptions } from '../lib/db-config';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}
const client = postgres(connectionString, {
  prepare: false,
  ...resolveDbOptions(connectionString),
});
const db = drizzle(client, { schema });

const userId = process.argv[2];
if (!userId) {
  console.error('Usage: npm run db:seed -- <clerk-user-id>');
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

  const demo = buildDemoWorkspace(userId);
  const result = await db.transaction(async (tx) => {
    const ownedAccounts = await tx
      .select({ id: schema.accounts.id })
      .from(schema.accounts)
      .where(eq(schema.accounts.userId, userId));
    const ownedCategories = await tx
      .select({ id: schema.categories.id })
      .from(schema.categories)
      .where(eq(schema.categories.userId, userId));

    // Cascade from accounts removes their transactions; we also explicitly
    // clear any transactions tagged with this user_id in case orphans exist.
    await tx.delete(schema.transactions).where(eq(schema.transactions.userId, userId));
    await tx.delete(schema.accounts).where(eq(schema.accounts.userId, userId));
    await tx.delete(schema.categories).where(eq(schema.categories.userId, userId));

    await tx.insert(schema.accounts).values(demo.accounts);
    await tx.insert(schema.categories).values(demo.categories);
    if (demo.transactions.length > 0) {
      await tx.insert(schema.transactions).values(demo.transactions);
    }

    return {
      clearedAccounts: ownedAccounts.length,
      clearedCategories: ownedCategories.length,
    };
  });

  console.log(`  cleared ${result.clearedAccounts} accounts, ${result.clearedCategories} categories`);
  console.log(`  inserted ${demo.accounts.length} accounts`);
  console.log(`  inserted ${demo.categories.length} categories`);
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
