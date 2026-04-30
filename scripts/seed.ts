import 'dotenv/config';
import { config } from 'dotenv';
import { subDays, eachDayOfInterval, format } from 'date-fns';

config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, inArray } from 'drizzle-orm';

import * as schema from '../db/schema';

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

const SEED_ACCOUNTS = ['Chase Checking', 'Apple Card', 'Savings'];
const SEED_CATEGORIES = ['Groceries', 'Rent', 'Salary', 'Dining', 'Transport', 'Entertainment'];

const TX_PATTERNS = [
  { payee: 'Whole Foods', amount: -45_00, category: 'Groceries' },
  { payee: 'Trader Joes', amount: -38_00, category: 'Groceries' },
  { payee: 'Landlord LLC', amount: -1850_00, category: 'Rent' },
  { payee: 'Acme Corp', amount: 4200_00, category: 'Salary' },
  { payee: 'Chipotle', amount: -16_00, category: 'Dining' },
  { payee: 'Sushi Place', amount: -52_00, category: 'Dining' },
  { payee: 'Uber', amount: -22_00, category: 'Transport' },
  { payee: 'Lyft', amount: -14_00, category: 'Transport' },
  { payee: 'Netflix', amount: -15_00, category: 'Entertainment' },
  { payee: 'Spotify', amount: -10_00, category: 'Entertainment' },
  { payee: 'Movie Theater', amount: -28_00, category: 'Entertainment' },
];

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

  const accountRows = SEED_ACCOUNTS.map((name) => ({
    id: crypto.randomUUID(),
    name,
    userId,
  }));
  await db.insert(schema.accounts).values(accountRows);
  console.log(`  inserted ${accountRows.length} accounts`);

  const categoryRows = SEED_CATEGORIES.map((name) => ({
    id: crypto.randomUUID(),
    name,
    userId,
  }));
  await db.insert(schema.categories).values(categoryRows);
  console.log(`  inserted ${categoryRows.length} categories`);

  const categoryByName = Object.fromEntries(categoryRows.map((c) => [c.name, c.id]));
  const accountId = accountRows[0].id;

  const today = new Date();
  const start = subDays(today, 60);
  const days = eachDayOfInterval({ start, end: today });

  const txRows = days.flatMap((day) => {
    const count = Math.random() < 0.6 ? 1 : Math.random() < 0.85 ? 2 : 0;
    const out: typeof schema.transactions.$inferInsert[] = [];
    for (let i = 0; i < count; i++) {
      const pattern = TX_PATTERNS[Math.floor(Math.random() * TX_PATTERNS.length)];
      const jitter = 1 + (Math.random() - 0.5) * 0.4;
      out.push({
        id: crypto.randomUUID(),
        amount: Math.round(pattern.amount * jitter * 1000),
        payee: pattern.payee,
        notes: null,
        date: day,
        accountId,
        categoryId: categoryByName[pattern.category] ?? null,
      });
    }
    return out;
  });

  if (txRows.length > 0) {
    await db.insert(schema.transactions).values(txRows);
  }
  console.log(
    `  inserted ${txRows.length} transactions across ${format(start, 'MMM dd')} - ${format(today, 'MMM dd')}`,
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
