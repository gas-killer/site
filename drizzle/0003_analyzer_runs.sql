CREATE TABLE "analyzer_run" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"network" text,
	"tx_hash" text,
	"target" text,
	"owned" text[],
	"status" integer NOT NULL,
	"error_code" text,
	"error" text,
	"method" text,
	"gas_used" bigint,
	"estimate" bigint,
	"details" jsonb,
	"duration_ms" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analyzer_run" ADD CONSTRAINT "analyzer_run_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analyzer_run_userId_createdAt_idx" ON "analyzer_run" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "analyzer_run_createdAt_idx" ON "analyzer_run" USING btree ("created_at");