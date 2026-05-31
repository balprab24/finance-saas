CREATE TABLE "plaid_items" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"plaid_item_id" text NOT NULL,
	"access_token" text NOT NULL,
	"institution_id" text,
	"institution_name" text,
	"cursor" text,
	"status" text DEFAULT 'active' NOT NULL,
	"last_synced_at" timestamp,
	"last_webhook_at" timestamp,
	"error_code" text,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plaid_items_id_user_id_key" UNIQUE("id","user_id")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "plaid_item_id" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "plaid_id" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "pending_plaid_id" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "plaid_account_id" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "merchant_name" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "payment_channel" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "pending" boolean DEFAULT false NOT NULL;--> statement-breakpoint
-- Plaid item/account tenant FK:
-- `SET NULL (plaid_item_id)` requires Postgres 15+ and nulls only the nullable
-- link column, preserving the NOT NULL `accounts.user_id`. drizzle-kit cannot
-- model the column list, so this migration is the source of truth for this FK.
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_plaid_item_user_fk" FOREIGN KEY ("plaid_item_id","user_id") REFERENCES "public"."plaid_items"("id","user_id") ON DELETE SET NULL ("plaid_item_id") ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "plaid_items_user_id_idx" ON "plaid_items" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "plaid_items_plaid_item_id_uq" ON "plaid_items" USING btree ("plaid_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_user_plaid_id_uq" ON "accounts" USING btree ("user_id","plaid_id") WHERE "accounts"."plaid_id" is not null;--> statement-breakpoint
CREATE INDEX "transactions_user_plaid_id_idx" ON "transactions" USING btree ("user_id","plaid_id");--> statement-breakpoint
CREATE INDEX "transactions_user_plaid_account_id_idx" ON "transactions" USING btree ("user_id","plaid_account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_user_plaid_id_uq" ON "transactions" USING btree ("user_id","plaid_id") WHERE "transactions"."plaid_id" is not null;
