import { and, asc, desc, eq, inArray, isNull, or } from "drizzle-orm";
import type { DB } from "@/db";
import { labLogs, memberships, milestones, reviews, submissions, users } from "@/db/schema";
import { STAGE_TITLES, type Stage } from "../curriculum";
import { nextStage, summarizeHours } from "../capstone/rules";
import { reviewSchema } from "../capstone/validation";
import { requireRole, ServiceError, type Actor } from "./errors";
import { notify } from "./notifications";

/**
 * Students an advisor may see and review: students in the advisor's course who are
 * assigned to them, or not assigned to anyone yet.
 */
export async function visibleStudents(db: DB, advisor: Actor) {
  requireRole(advisor, "advisor");
  return db
    .select({ membershipId: memberships.id, name: users.name, track: memberships.track, advisorId: memberships.advisorId })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(
      and(
        eq(memberships.courseId, advisor.courseId),
        eq(memberships.role, "student"),
        or(eq(memberships.advisorId, advisor.membershipId), isNull(memberships.advisorId)),
      ),
    )
    .orderBy(asc(users.name));
}

export async function assertCanReview(db: DB, advisor: Actor, studentMembershipId: string) {
  const students = await visibleStudents(db, advisor);
  if (!students.some((s) => s.membershipId === studentMembershipId)) {
    throw new ServiceError("You don't have access to this student.", "forbidden");
  }
}

export async function getQueue(db: DB, advisor: Actor) {
  const students = await visibleStudents(db, advisor);
  const ids = students.map((s) => s.membershipId);
  const nameOf = new Map(students.map((s) => [s.membershipId, s]));
  if (ids.length === 0) return { students, submissions: [], labLogs: [] };

  const waiting = await db
    .select()
    .from(milestones)
    .where(and(inArray(milestones.membershipId, ids), eq(milestones.status, "submitted")))
    .orderBy(asc(milestones.updatedAt));
  const subs = waiting.length
    ? await db
        .select()
        .from(submissions)
        .where(inArray(submissions.milestoneId, waiting.map((m) => m.id)))
        .orderBy(desc(submissions.createdAt))
    : [];

  const pendingSubmissions = waiting.flatMap((m) => {
    const latest = subs.find((s) => s.milestoneId === m.id);
    if (!latest) return [];
    const student = nameOf.get(m.membershipId)!;
    return [{ submission: latest, stage: m.stage as Stage, student, isResubmission: subs.filter((s) => s.milestoneId === m.id).length > 1 }];
  });

  const pendingLogs = await db
    .select()
    .from(labLogs)
    .where(and(inArray(labLogs.membershipId, ids), eq(labLogs.status, "pending")))
    .orderBy(asc(labLogs.createdAt));

  return {
    students,
    submissions: pendingSubmissions,
    labLogs: pendingLogs.map((log) => ({ log, student: nameOf.get(log.membershipId)! })),
  };
}

export async function reviewSubmission(db: DB, advisor: Actor, submissionId: string, raw: Record<string, string>) {
  requireRole(advisor, "advisor");
  const parsed = reviewSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: parsed.error };
  const { decision, comment } = parsed.data;
  if (decision === "returned") throw new ServiceError("Use approve or request revision for submissions.");

  const [row] = await db
    .select({ submission: submissions, milestone: milestones })
    .from(submissions)
    .innerJoin(milestones, eq(milestones.id, submissions.milestoneId))
    .where(eq(submissions.id, submissionId));
  if (!row) throw new ServiceError("Submission not found.", "not_found");
  await assertCanReview(db, advisor, row.milestone.membershipId);

  const [latest] = await db
    .select({ id: submissions.id })
    .from(submissions)
    .where(eq(submissions.milestoneId, row.milestone.id))
    .orderBy(desc(submissions.createdAt))
    .limit(1);
  if (latest?.id !== submissionId) throw new ServiceError("A newer version of this submission exists.", "conflict");

  const stage = row.milestone.stage as Stage;
  await db.transaction(async (tx) => {
    const updated = await tx
      .update(milestones)
      .set({ status: decision === "approved" ? "approved" : "revision", updatedAt: new Date() })
      .where(and(eq(milestones.id, row.milestone.id), eq(milestones.status, "submitted")))
      .returning({ id: milestones.id });
    if (updated.length === 0) throw new ServiceError("This submission has already been reviewed.", "conflict");

    const unlock = decision === "approved" ? nextStage(stage) : null;
    if (unlock) {
      await tx
        .update(milestones)
        .set({ status: "open", updatedAt: new Date() })
        .where(
          and(
            eq(milestones.membershipId, row.milestone.membershipId),
            eq(milestones.stage, unlock),
            eq(milestones.status, "locked"),
          ),
        );
    }

    await tx.insert(reviews).values({
      reviewerId: advisor.membershipId,
      targetType: "submission",
      targetId: submissionId,
      decision,
      comment: comment || null,
    });
    await notify(
      tx,
      [row.milestone.membershipId],
      decision === "approved"
        ? `Stage ${stage}: ${STAGE_TITLES[stage]} was approved.${unlock ? ` Stage ${unlock} is now unlocked.` : " Your capstone is complete!"}`
        : `Your advisor requested revisions on Stage ${stage}: ${STAGE_TITLES[stage]}.`,
      "/",
    );
  });
  return { ok: true as const };
}

export async function reviewLabLog(db: DB, advisor: Actor, labLogId: string, raw: Record<string, string>) {
  requireRole(advisor, "advisor");
  const parsed = reviewSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: parsed.error };
  const { decision, comment } = parsed.data;
  if (decision === "revision") throw new ServiceError("Lab entries are either approved or returned.");

  const [log] = await db.select().from(labLogs).where(eq(labLogs.id, labLogId));
  if (!log) throw new ServiceError("Lab entry not found.", "not_found");
  await assertCanReview(db, advisor, log.membershipId);

  await db.transaction(async (tx) => {
    const updated = await tx
      .update(labLogs)
      .set({ status: decision === "approved" ? "approved" : "returned" })
      .where(and(eq(labLogs.id, labLogId), eq(labLogs.status, "pending")))
      .returning({ id: labLogs.id });
    if (updated.length === 0) throw new ServiceError("This lab entry has already been reviewed.", "conflict");

    await tx.insert(reviews).values({
      reviewerId: advisor.membershipId,
      targetType: "lab_log",
      targetId: labLogId,
      decision,
      comment: comment || null,
    });
    await notify(
      tx,
      [log.membershipId],
      decision === "approved"
        ? `${log.hours} lab hours on ${log.date} were verified.`
        : `Your ${log.hours}-hour lab entry on ${log.date} was returned. See your advisor's comment.`,
      "/?tab=lab",
    );
  });
  return { ok: true as const };
}

/** Advisors in the actor's course, for the assignment dropdown. */
export async function courseAdvisors(db: DB, advisor: Actor) {
  requireRole(advisor, "advisor");
  return db
    .select({ membershipId: memberships.id, name: users.name })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(and(eq(memberships.courseId, advisor.courseId), eq(memberships.role, "advisor")))
    .orderBy(asc(users.name));
}

/**
 * Assign a visible student (yours or unassigned) to an advisor in the same course, or
 * unassign them (`toAdvisorId` = null).
 */
export async function assignAdvisor(db: DB, advisor: Actor, studentMembershipId: string, toAdvisorId: string | null) {
  await assertCanReview(db, advisor, studentMembershipId);
  let targetName: string | null = null;
  if (toAdvisorId) {
    const target = (await courseAdvisors(db, advisor)).find((a) => a.membershipId === toAdvisorId);
    if (!target) throw new ServiceError("That advisor isn't in this course.", "forbidden");
    targetName = target.name;
  }

  await db.transaction(async (tx) => {
    const [before] = await tx.select().from(memberships).where(eq(memberships.id, studentMembershipId));
    if (before.advisorId === toAdvisorId) return;
    await tx.update(memberships).set({ advisorId: toAdvisorId }).where(eq(memberships.id, studentMembershipId));
    const [student] = await tx.select({ name: users.name }).from(users).where(eq(users.id, before.userId));
    if (toAdvisorId && toAdvisorId !== advisor.membershipId) {
      await notify(tx, [toAdvisorId], `${student?.name ?? "A student"} was assigned to you as an advisee.`, `/advisor/students/${studentMembershipId}`);
    }
    await notify(
      tx,
      [studentMembershipId],
      targetName ? `${targetName} is now your capstone advisor.` : "Your capstone advisor assignment was removed.",
      "/",
    );
  });
}

/** Approved lab hours for every visible student, for CSV export. */
export async function verifiedHoursReport(db: DB, advisor: Actor) {
  const students = await visibleStudents(db, advisor);
  const ids = students.map((s) => s.membershipId);
  const logs = ids.length ? await db.select().from(labLogs).where(inArray(labLogs.membershipId, ids)).orderBy(asc(labLogs.date)) : [];
  const approvals = logs.length
    ? await db
        .select({ targetId: reviews.targetId, reviewedAt: reviews.createdAt, reviewer: users.name })
        .from(reviews)
        .innerJoin(memberships, eq(memberships.id, reviews.reviewerId))
        .innerJoin(users, eq(users.id, memberships.userId))
        .where(and(eq(reviews.targetType, "lab_log"), eq(reviews.decision, "approved"), inArray(reviews.targetId, logs.map((l) => l.id))))
    : [];
  const approvalOf = new Map(approvals.map((a) => [a.targetId, a]));

  return students.map((s) => {
    const mine = logs.filter((l) => l.membershipId === s.membershipId);
    return {
      student: s,
      entries: mine.filter((l) => l.status === "approved").map((l) => ({ ...l, approval: approvalOf.get(l.id) ?? null })),
      summary: summarizeHours(mine, 0),
    };
  });
}
