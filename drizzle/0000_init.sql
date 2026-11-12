CREATE TYPE "public"."lab_log_status" AS ENUM('pending', 'approved', 'returned');--> statement-breakpoint
CREATE TYPE "public"."milestone_status" AS ENUM('locked', 'open', 'submitted', 'revision', 'approved');--> statement-breakpoint
CREATE TYPE "public"."review_decision" AS ENUM('approved', 'revision', 'returned');--> statement-breakpoint
CREATE TYPE "public"."review_target" AS ENUM('submission', 'lab_log');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('student', 'advisor');--> statement-breakpoint
CREATE TYPE "public"."track" AS ENUM('flagship', 'project');--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lti_issuer" text,
	"lti_context_id" text,
	"title" text NOT NULL,
	"term" text NOT NULL,
	"required_hours" double precision DEFAULT 50 NOT NULL,
	"deadline" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "courses_lti_context" UNIQUE("lti_issuer","lti_context_id")
);
--> statement-breakpoint
CREATE TABLE "lab_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"membership_id" uuid NOT NULL,
	"date" date NOT NULL,
	"hours" double precision NOT NULL,
	"location" text NOT NULL,
	"activity" text NOT NULL,
	"status" "lab_log_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"role" "role" NOT NULL,
	"advisor_id" uuid,
	"track" "track",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_user_course" UNIQUE("user_id","course_id")
);
--> statement-breakpoint
CREATE TABLE "milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"membership_id" uuid NOT NULL,
	"stage" integer NOT NULL,
	"status" "milestone_status" DEFAULT 'locked' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "milestones_membership_stage" UNIQUE("membership_id","stage")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"membership_id" uuid NOT NULL,
	"message" text NOT NULL,
	"href" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"target_type" "review_target" NOT NULL,
	"target_id" uuid NOT NULL,
	"decision" "review_decision" NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"milestone_id" uuid NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"lti_issuer" text,
	"lti_sub" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_lti_identity" UNIQUE("lti_issuer","lti_sub")
);
--> statement-breakpoint
ALTER TABLE "lab_logs" ADD CONSTRAINT "lab_logs_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_advisor_id_memberships_id_fk" FOREIGN KEY ("advisor_id") REFERENCES "public"."memberships"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_memberships_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_milestone_id_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."milestones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lab_logs_membership_idx" ON "lab_logs" USING btree ("membership_id");--> statement-breakpoint
CREATE INDEX "memberships_course_idx" ON "memberships" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "notifications_membership_idx" ON "notifications" USING btree ("membership_id");--> statement-breakpoint
CREATE INDEX "reviews_target_idx" ON "reviews" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "submissions_milestone_idx" ON "submissions" USING btree ("milestone_id");