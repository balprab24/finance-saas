CREATE TABLE "plaid_webhook_events" (
	"request_body_sha256" text PRIMARY KEY NOT NULL,
	"plaid_item_id" text,
	"webhook_type" text,
	"webhook_code" text,
	"received_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"reset_at" timestamp NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "plaid_webhook_events_item_idx" ON "plaid_webhook_events" USING btree ("plaid_item_id");--> statement-breakpoint
CREATE INDEX "plaid_webhook_events_received_at_idx" ON "plaid_webhook_events" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "rate_limits_reset_at_idx" ON "rate_limits" USING btree ("reset_at");