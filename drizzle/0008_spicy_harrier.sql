CREATE TYPE "public"."ticket_category" AS ENUM('bug', 'feature', 'question');--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "category" "ticket_category" DEFAULT 'question' NOT NULL;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "over_budget" boolean DEFAULT false NOT NULL;