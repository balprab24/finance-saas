CREATE TABLE "recurring_ignores" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"merchant_key" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX "recurring_ignores_user_id_idx" ON "recurring_ignores" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "recurring_ignores_user_merchant_uq" ON "recurring_ignores" USING btree ("user_id","merchant_key");