-- Tenant isolation hardening:
--   * Composite UNIQUE on (id, user_id) for accounts and categories
--   * Replace single-column FKs from transactions with composite (id, user_id) FKs
--   * Promote transactions.amount from integer to bigint
--
-- Pre-flight: if any historical row violates the new tenant invariant, the
-- ADD CONSTRAINT below will fail. Run these manually and clean up first:
--   SELECT t.id FROM transactions t
--     JOIN accounts a ON a.id = t.account_id
--     WHERE a.user_id <> t.user_id;
--   SELECT t.id FROM transactions t
--     JOIN categories c ON c.id = t.category_id
--     WHERE c.user_id <> t.user_id;
--
-- The drizzle-orm migrator runs each migration file in a single transaction,
-- so failure of any statement below rolls the whole file back automatically.
--
-- Note: `SET NULL (category_id)` on the category FK requires Postgres 15+ and
-- nulls only category_id (preserving the NOT NULL user_id). drizzle-kit cannot
-- model the column list — if `db:generate` later emits a diff for this FK,
-- discard it; this migration file is the source of truth.
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_id_user_id_key" UNIQUE("id","user_id");--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_id_user_id_key" UNIQUE("id","user_id");--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "amount" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_account_id_accounts_id_fk";--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_category_id_categories_id_fk";--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_user_fk" FOREIGN KEY ("account_id","user_id") REFERENCES "public"."accounts"("id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_user_fk" FOREIGN KEY ("category_id","user_id") REFERENCES "public"."categories"("id","user_id") ON DELETE SET NULL ("category_id") ON UPDATE no action;
