ALTER TABLE "transactions" ADD COLUMN "user_id" text;--> statement-breakpoint
UPDATE "transactions" AS "t" SET "user_id" = "a"."user_id" FROM "accounts" AS "a" WHERE "a"."id" = "t"."account_id";--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_user_id_name_uq" ON "accounts" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "categories_user_id_idx" ON "categories" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_user_id_name_uq" ON "categories" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "transactions_user_id_idx" ON "transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transactions_account_id_idx" ON "transactions" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "transactions_category_id_idx" ON "transactions" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "transactions_user_date_idx" ON "transactions" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "transactions_account_date_idx" ON "transactions" USING btree ("account_id","date");
