CREATE TABLE "plaid_sync_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"item_id" text NOT NULL,
	"reason" text DEFAULT 'manual' NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"finished_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "plaid_sync_jobs" ADD CONSTRAINT "plaid_sync_jobs_item_user_fk" FOREIGN KEY ("item_id","user_id") REFERENCES "public"."plaid_items"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "plaid_sync_jobs_user_status_idx" ON "plaid_sync_jobs" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "plaid_sync_jobs_item_idx" ON "plaid_sync_jobs" USING btree ("item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "plaid_sync_jobs_active_item_uq" ON "plaid_sync_jobs" USING btree ("user_id","item_id") WHERE "plaid_sync_jobs"."status" in ('queued', 'running');