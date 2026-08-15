import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

// Real-Postgres test that the composite (id, user_id) foreign keys physically
// reject a cross-tenant reference — the DB-level half of tenant isolation that a
// JS mock cannot model. The app layer already scopes every query by userId; this
// proves the schema is the backstop if application code ever slipped. Skipped
// unless DATABASE_URL is set (CI sets it and runs migrations first). Modules are
// imported dynamically so the default `npm test` run never loads db/drizzle.
const HAS_DB = Boolean(process.env.DATABASE_URL);

type Db = (typeof import('@/db/drizzle'))['db'];
type Schema = typeof import('@/db/schema');

describe.skipIf(!HAS_DB)('tenant isolation — composite FK enforcement (integration)', () => {
  const alice = `itest_alice_${crypto.randomUUID()}`;
  const bob = `itest_bob_${crypto.randomUUID()}`;
  let db: Db;
  let schema: Schema;

  const ids = {
    aliceAccount: crypto.randomUUID(),
    bobAccount: crypto.randomUUID(),
    aliceCategory: crypto.randomUUID(),
    bobCategory: crypto.randomUUID(),
  };

  beforeAll(async () => {
    db = (await import('@/db/drizzle')).db;
    schema = await import('@/db/schema');

    await db.insert(schema.accounts).values([
      { id: ids.aliceAccount, userId: alice, name: 'Alice Checking' },
      { id: ids.bobAccount, userId: bob, name: 'Bob Checking' },
    ]);
    await db.insert(schema.categories).values([
      { id: ids.aliceCategory, userId: alice, name: 'Alice Food' },
      { id: ids.bobCategory, userId: bob, name: 'Bob Food' },
    ]);
  });

  // Each test may leave alice-owned child rows; clear them between cases.
  afterEach(async () => {
    await db.delete(schema.transactions).where(eq(schema.transactions.userId, alice));
    await db.delete(schema.budgets).where(eq(schema.budgets.userId, alice));
  });

  afterAll(async () => {
    for (const uid of [alice, bob]) {
      await db.delete(schema.transactions).where(eq(schema.transactions.userId, uid));
      await db.delete(schema.budgets).where(eq(schema.budgets.userId, uid));
      await db.delete(schema.accounts).where(eq(schema.accounts.userId, uid));
      await db.delete(schema.categories).where(eq(schema.categories.userId, uid));
    }
  });

  // Drizzle wraps driver errors in a DrizzleQueryError, so the Postgres SQLSTATE
  // lives on `.cause`, not on the thrown error itself. 23503 = foreign_key_violation.
  const FK_VIOLATION = { cause: { code: '23503' } };

  function insertTransaction(overrides: Partial<typeof schema.transactions.$inferInsert> = {}) {
    return db.insert(schema.transactions).values({
      id: crypto.randomUUID(),
      amount: -1000,
      payee: 'Test',
      date: new Date('2026-07-01'),
      userId: alice,
      accountId: ids.aliceAccount,
      ...overrides,
    });
  }

  it('allows a transaction that references the same tenant account and category', async () => {
    await expect(insertTransaction({ categoryId: ids.aliceCategory })).resolves.toBeDefined();
  });

  it('rejects a transaction referencing another tenant account (FK 23503)', async () => {
    await expect(insertTransaction({ accountId: ids.bobAccount })).rejects.toMatchObject(
      FK_VIOLATION,
    );
  });

  it('rejects a transaction referencing another tenant category (FK 23503)', async () => {
    await expect(insertTransaction({ categoryId: ids.bobCategory })).rejects.toMatchObject(
      FK_VIOLATION,
    );
  });

  it('rejects a budget referencing another tenant category (FK 23503)', async () => {
    await expect(
      db.insert(schema.budgets).values({
        id: crypto.randomUUID(),
        userId: alice,
        categoryId: ids.bobCategory,
        month: '2026-07-01',
        amount: 50000,
      }),
    ).rejects.toMatchObject(FK_VIOLATION);
  });
});
