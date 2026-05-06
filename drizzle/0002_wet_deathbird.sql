-- Rename plan tiers: basic→care, pro→studio, partner→atelier.
-- Before swapping the enum, downgrade the columns to text, remap any
-- existing rows from the old labels, then create the new enum and
-- cast back. This keeps the migration safe-by-construction.
ALTER TABLE "organizations" ALTER COLUMN "plan" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "plan" SET DATA TYPE text;--> statement-breakpoint
UPDATE "organizations" SET "plan" = CASE
  WHEN "plan" = 'basic' THEN 'care'
  WHEN "plan" = 'pro' THEN 'studio'
  WHEN "plan" = 'partner' THEN 'atelier'
  ELSE "plan"
END;--> statement-breakpoint
UPDATE "subscriptions" SET "plan" = CASE
  WHEN "plan" = 'basic' THEN 'care'
  WHEN "plan" = 'pro' THEN 'studio'
  WHEN "plan" = 'partner' THEN 'atelier'
  ELSE "plan"
END;--> statement-breakpoint
DROP TYPE "public"."plan";--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('care', 'studio', 'atelier');--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "plan" SET DATA TYPE "public"."plan" USING "plan"::"public"."plan";--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "plan" SET DATA TYPE "public"."plan" USING "plan"::"public"."plan";
