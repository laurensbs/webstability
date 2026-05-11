-- Trimmed to only the new blog_drafts table. The auto-generated diff also
-- listed handover_checklist / leads / nps_responses / referrals / project_updates
-- / files-columns CREATE statements because earlier schema changes were applied
-- via `drizzle-kit push` (dev) without a matching migration file, so the
-- snapshot lagged. Those objects already exist in every environment; only the
-- blog_drafts table is genuinely new. Keeping just this keeps `db:migrate`
-- idempotent against the live DB.

CREATE TYPE "public"."blog_draft_status" AS ENUM('pending', 'generated', 'published', 'skipped', 'failed');--> statement-breakpoint
CREATE TABLE "blog_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"target_keywords" text NOT NULL,
	"brief" text NOT NULL,
	"priority" integer DEFAULT 100 NOT NULL,
	"status" "blog_draft_status" DEFAULT 'pending' NOT NULL,
	"body_mdx" text,
	"model" text,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"generated_at" timestamp with time zone,
	CONSTRAINT "blog_drafts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "blog_drafts_status_priority_idx" ON "blog_drafts" USING btree ("status","priority");
