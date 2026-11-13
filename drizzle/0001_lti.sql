CREATE TABLE "launch_tickets" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"membership_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lti_deployments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform_id" uuid NOT NULL,
	"deployment_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lti_deployments_platform_deployment" UNIQUE("platform_id","deployment_id")
);
--> statement-breakpoint
CREATE TABLE "lti_platforms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"issuer" text NOT NULL,
	"client_id" text NOT NULL,
	"auth_url" text NOT NULL,
	"token_url" text NOT NULL,
	"jwks_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lti_platforms_issuer_client" UNIQUE("issuer","client_id")
);
--> statement-breakpoint
CREATE TABLE "lti_states" (
	"state" text PRIMARY KEY NOT NULL,
	"nonce" text NOT NULL,
	"platform_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "launch_tickets" ADD CONSTRAINT "launch_tickets_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lti_deployments" ADD CONSTRAINT "lti_deployments_platform_id_lti_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."lti_platforms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lti_states" ADD CONSTRAINT "lti_states_platform_id_lti_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."lti_platforms"("id") ON DELETE cascade ON UPDATE no action;