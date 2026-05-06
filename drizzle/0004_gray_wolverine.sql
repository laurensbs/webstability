CREATE TYPE "public"."build_extension" AS ENUM('light', 'standard', 'custom');--> statement-breakpoint
CREATE TABLE "build_phases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"extension" "build_extension" NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"duration_months" integer NOT NULL,
	"project_id" uuid,
	"label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "build_phases" ADD CONSTRAINT "build_phases_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "build_phases" ADD CONSTRAINT "build_phases_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "build_phase_org_active_idx" ON "build_phases" USING btree ("organization_id","ends_at");