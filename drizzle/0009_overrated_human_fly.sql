CREATE TABLE "budgets" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"category_id" text NOT NULL,
	"month" date NOT NULL,
	"amount" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_category_user_fk" FOREIGN KEY ("category_id","user_id") REFERENCES "public"."categories"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "budgets_user_month_idx" ON "budgets" USING btree ("user_id","month");--> statement-breakpoint
CREATE UNIQUE INDEX "budgets_user_category_month_uq" ON "budgets" USING btree ("user_id","category_id","month");