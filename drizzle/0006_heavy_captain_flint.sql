CREATE TABLE "discounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"stripe_coupon_id" text,
	"percent_off" integer NOT NULL,
	"months_applied" integer,
	"reason" text NOT NULL,
	"granted_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "is_vip" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "discounts" ADD CONSTRAINT "discounts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discounts" ADD CONSTRAINT "discounts_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "discounts_org_idx" ON "discounts" USING btree ("organization_id","created_at");