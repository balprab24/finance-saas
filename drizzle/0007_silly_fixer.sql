ALTER TABLE "plaid_sync_jobs" ADD COLUMN "max_attempts" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "plaid_sync_jobs" ADD COLUMN "next_attempt_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX "plaid_sync_jobs_due_idx" ON "plaid_sync_jobs" USING btree ("status","next_attempt_at");