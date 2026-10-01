ALTER TABLE "user" ADD COLUMN "newsletter_opt_in" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "newsletter_subscribed_at" timestamp;