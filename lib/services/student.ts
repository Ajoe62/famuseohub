import { and, asc, desc, eq, inArray } from "drizzle-orm";
import type { DB } from "@/db";
import { courses, labLogs, memberships, milestones, reviews, submissions, users } from "@/db/schema";
import type { Review } from "@/db/schema";
import { STAGE_TITLES, STAGES, TRACKS, type Stage, type Track } from "../curriculum";
import { canChangeTrack, checkSubmission, initialMilestoneStatuses, summarizeHours, type MilestoneStatus } from "../capstone/rules";
import { labLogSchema, stageSchema } from "../capstone/validation";
import { requireRole, ServiceError, type Actor } from "./errors";
import { advisorsFor, notify } from "./notifications";

async function loadStudent(db: DB, membershipId: string) {
  const [row] = await db.select().from(memberships).where(eq(memberships.id, membershipId));
  if (!row || row.role !== "student") throw new ServiceError("Student not found.", "not_found");
  return row;
}

async function stageStatuses(db: DB, membershipId: string) {
  const rows = await db.select().from(milestones).where(eq(milestones.membershipId, membershipId));
  const statuses: Partial<Record<Stage, MilestoneStatus>> = {};
  for (const m of rows) statuses[m.stage as Stage] = m.status;
  return { rows, statuses };
}

export async function chooseTrack(db: DB, actor: Actor, track: Track) {
  requireRole(actor, "student");
  if (!(track in TRACKS)) throw new ServiceError("Unknown track.");
  const { rows, statuses } = await stageStatuses(db, actor.membershipId);
  if (rows.length > 0 && !canChangeTrack(statuses)) {
    throw new ServiceError("You can't change tracks after submitting work. Ask your advisor.", "conflict");
  }
  const initial = initialMilestoneStatuses();
  await db.transaction(async (tx) => {
    await tx.delete(milestones).where(eq(milestones.membershipId, actor.membershipId));
    await tx.update(memberships).set({ track }).where(eq(memberships.id, actor.membershipId));
    await tx.insert(milestones).values(STAGES.map((stage) => ({ membershipId: actor.membershipId, stage, status: initial[stage] })));
  });
}

export async function submitStage(db: DB, actor: Actor, stage: Stage, raw: Record<string, string>) {
  requireRole(actor, "student");
  const student = await loadStudent(db, actor.membershipId);
  if (!student.track) throw new ServiceError("Choose a capstone track first.");

  const { rows, statuses } = await stageStatuses(db, actor.membershipId);
  const check = checkSubmission(stage, statuses);
  if (!check.ok) throw new ServiceError(check.reason, "conflict");

  const parsed = stageSchema(student.track, stage).safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: parsed.error };

  const milestone = rows.find((m) => m.stage === stage)!;
  const data = Object.fromEntries(Object.entries(parsed.data).filter(([, v]) => v !== undefined)) as Record<string, string>;

  await db.transaction(async (tx) => {
    // Conditional update makes double-submits and races safe: only one wins.
    const updated = await tx
      .update(milestones)
      .set({ status: "submitted", updatedAt: new Date() })
      .where(and(eq(milestones.id, milestone.id), inArray(milestones.status, ["open", "revision"])))
      .returning({ id: milestones.id });
    if (updated.length === 0) throw new ServiceError("This stage is already awaiting review.", "conflict");

    await tx.insert(submissions).values({ milestoneId: milestone.id, data });
    const [user] = await tx.select({ name: users.name }).from(users).where(eq(users.id, actor.userId));
    await notify(
      tx,
      await advisorsFor(tx, student),
      `${user?.name ?? "A student"} submitted Stage ${stage}: ${STAGE_TITLES[stage]}.`,
      "/advisor",
    );
  });
  return { ok: true as const };
}

export async function logLabHours(db: DB, actor: Actor, raw: Record<string, string>) {
  requireRole(actor, "student");
  const student = await loadStudent(db, actor.membershipId);
  const parsed = labLogSchema().safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: parsed.error };

  await db.transaction(async (tx) => {
    await tx.insert(labLogs).values({ membershipId: actor.membershipId, ...parsed.data });
    const [user] = await tx.select({ name: users.name }).from(users).where(eq(users.id, actor.userId));
    await notify(
      tx,
      await advisorsFor(tx, student),
      `${user?.name ?? "A student"} logged ${parsed.data.hours} lab hours for verification.`,
      "/advisor",
    );
  });
  return { ok: true as const };
}

/** Latest review per target id. */
function latestReviews(rows: Review[]) {
  const map = new Map<string, Review>();
  for (const r of rows) {
    const prev = map.get(r.targetId);
    if (!prev || r.createdAt > prev.createdAt) map.set(r.targetId, r);
  }
  return map;
}

/** Everything a student's hub page needs. Also used by the advisor's per-student view. */
export async function getStudentOverview(db: DB, membershipId: string) {
  const student = await loadStudent(db, membershipId);
  const [[course], [user]] = await Promise.all([
    db.select().from(courses).where(eq(courses.id, student.courseId)),
    db.select().from(users).where(eq(users.id, student.userId)),
  ]);

  const stageRows = await db
    .select()
    .from(milestones)
    .where(eq(milestones.membershipId, membershipId))
    .orderBy(asc(milestones.stage));
  const subs = stageRows.length
    ? await db
        .select()
        .from(submissions)
        .where(inArray(submissions.milestoneId, stageRows.map((m) => m.id)))
        .orderBy(desc(submissions.createdAt))
    : [];
  const logs = await db
    .select()
    .from(labLogs)
    .where(eq(labLogs.membershipId, membershipId))
    .orderBy(desc(labLogs.date), desc(labLogs.createdAt));

  const targetIds = [...subs.map((s) => s.id), ...logs.map((l) => l.id)];
  const reviewRows = targetIds.length ? await db.select().from(reviews).where(inArray(reviews.targetId, targetIds)) : [];
  const latest = latestReviews(reviewRows);

  const stages = stageRows.map((m) => {
    const history = subs.filter((s) => s.milestoneId === m.id);
    const latestSubmission = history[0] ?? null;
    return {
      ...m,
      stage: m.stage as Stage,
      latestSubmission,
      latestReview: latestSubmission ? latest.get(latestSubmission.id) ?? null : null,
      submissionCount: history.length,
    };
  });

  const statuses = Object.fromEntries(stages.map((s) => [s.stage, s.status])) as Partial<Record<Stage, MilestoneStatus>>;

  return {
    course: course!,
    user: user!,
    membership: student,
    stages,
    canChangeTrack: stages.length === 0 || canChangeTrack(statuses),
    labLogs: logs.map((l) => ({ ...l, review: latest.get(l.id) ?? null })),
    hours: summarizeHours(logs, course!.requiredHours),
  };
}

export type StudentOverview = Awaited<ReturnType<typeof getStudentOverview>>;
