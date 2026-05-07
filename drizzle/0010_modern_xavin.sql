CREATE TYPE "public"."demo_event_kind" AS ENUM('entered', 'tour_completed', 'tour_dismissed', 'cta_clicked', 'session_ended');--> statement-breakpoint
CREATE TABLE "demo_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "demo_event_kind" NOT NULL,
	"source" text,
	"role" text,
	"user_agent" text,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "demo_events_kind_time_idx" ON "demo_events" USING btree ("kind","created_at");