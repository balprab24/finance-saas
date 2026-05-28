DROP INDEX "accounts_user_id_name_uq";--> statement-breakpoint
DROP INDEX "categories_user_id_name_uq";--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_user_id_name_uq" ON "accounts" USING btree ("user_id",lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "categories_user_id_name_uq" ON "categories" USING btree ("user_id",lower("name"));