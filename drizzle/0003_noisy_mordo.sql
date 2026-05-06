CREATE TABLE "hours_logged" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"worked_on" timestamp with time zone DEFAULT now() NOT NULL,
	"minutes" integer NOT NULL,
	"description" text NOT NULL,
	"project_id" uuid,
	"logged_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hours_logged" ADD CONSTRAINT "hours_logged_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hours_logged" ADD CONSTRAINT "hours_logged_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hours_logged" ADD CONSTRAINT "hours_logged_logged_by_users_id_fk" FOREIGN KEY ("logged_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hours_org_worked_idx" ON "hours_logged" USING btree ("organization_id","worked_on");