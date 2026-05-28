ALTER TABLE "transactions" DROP CONSTRAINT "transactions_account_id_accounts_id_fk";
--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "archived_at" timestamp;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_archived_idx" ON "accounts" USING btree ("user_id","archived_at");