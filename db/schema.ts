import {
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["student", "advisor"]);
export const trackEnum = pgEnum("track", ["flagship", "project"]);
export const milestoneStatusEnum = pgEnum("milestone_status", [
  "locked",
  "open",
  "submitted",
  "revision",
  "approved",
]);
export const labLogStatusEnum = pgEnum("lab_log_status", ["pending", "approved", "returned"]);
export const reviewTargetEnum = pgEnum("review_target", ["submission", "lab_log"]);
export const reviewDecisionEnum = pgEnum("review_decision", ["approved", "revision", "returned"]);

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

/**
 * A person. ltiIssuer + ltiSub identify them on a Canvas launch; both are null
 * for users created by the dev seed. Email is intentionally optional (data minimisation).
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email"),
    ltiIssuer: text("lti_issuer"),
    ltiSub: text("lti_sub"),
    createdAt: createdAt(),
  },
  (t) => [unique("users_lti_identity").on(t.ltiIssuer, t.ltiSub)],
);

/** A Canvas course (LTI context). Program settings are per course. */
export const courses = pgTable(
  "courses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ltiIssuer: text("lti_issuer"),
    ltiContextId: text("lti_context_id"),
    title: text("title").notNull(),
    term: text("term").notNull(),
    requiredHours: doublePrecision("required_hours").notNull().default(50),
    deadline: date("deadline"),
    createdAt: createdAt(),
  },
  (t) => [unique("courses_lti_context").on(t.ltiIssuer, t.ltiContextId)],
);

/**
 * A user's role in a course. For students, `advisorId` optionally assigns a
 * specific advisor membership; unassigned students are visible to every
 * advisor in the course so nobody falls through the cracks.
 */
export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull(),
    advisorId: uuid("advisor_id").references((): AnyPgColumn => memberships.id, { onDelete: "set null" }),
    track: trackEnum("track"),
    createdAt: createdAt(),
  },
  (t) => [unique("memberships_user_course").on(t.userId, t.courseId), index("memberships_course_idx").on(t.courseId)],
);

export const milestones = pgTable(
  "milestones",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    stage: integer("stage").notNull(),
    status: milestoneStatusEnum("status").notNull().default("locked"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("milestones_membership_stage").on(t.membershipId, t.stage)],
);

/** Every submission is kept, so revisions form a history. */
export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    milestoneId: uuid("milestone_id")
      .notNull()
      .references(() => milestones.id, { onDelete: "cascade" }),
    data: jsonb("data").$type<Record<string, string>>().notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("submissions_milestone_idx").on(t.milestoneId)],
);

export const labLogs = pgTable(
  "lab_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    hours: doublePrecision("hours").notNull(),
    location: text("location").notNull(),
    activity: text("activity").notNull(),
    status: labLogStatusEnum("status").notNull().default("pending"),
    createdAt: createdAt(),
  },
  (t) => [index("lab_logs_membership_idx").on(t.membershipId)],
);

/** Audit trail: every advisor decision, with who made it and when. */
export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reviewerId: uuid("reviewer_id")
      .notNull()
      .references(() => memberships.id),
    targetType: reviewTargetEnum("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    decision: reviewDecisionEnum("decision").notNull(),
    comment: text("comment"),
    createdAt: createdAt(),
  },
  (t) => [index("reviews_target_idx").on(t.targetType, t.targetId)],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    message: text("message").notNull(),
    href: text("href"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("notifications_membership_idx").on(t.membershipId)],
);

export type User = typeof users.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
export type Milestone = typeof milestones.$inferSelect;
export type MilestoneStatus = Milestone["status"];
export type Submission = typeof submissions.$inferSelect;
export type LabLog = typeof labLogs.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
