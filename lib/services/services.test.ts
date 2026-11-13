// Integration tests: real services against a fresh in-memory Postgres (PGlite) per test.
import { beforeEach, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import type { DB } from "@/db";
import { createTestDb } from "@/db/testing";
import { courses, labLogs, memberships, milestones, notifications, reviews, users } from "@/db/schema";
import { assignAdvisor, getQueue, reviewLabLog, reviewSubmission, verifiedHoursReport, visibleStudents } from "./advisor";
import { ServiceError, type Actor } from "./errors";
import { chooseTrack, getStudentOverview, logLabHours, submitStage } from "./student";

let db: DB;
let student: Actor;
let advisor: Actor;
let otherAdvisor: Actor;
let otherCourseAdvisor: Actor;

async function member(courseId: string, name: string, role: "student" | "advisor", advisorId?: string): Promise<Actor> {
  const [u] = await db.insert(users).values({ name }).returning();
  const [m] = await db.insert(memberships).values({ userId: u.id, courseId, role, advisorId }).returning();
  return { membershipId: m.id, userId: u.id, courseId, role };
}

beforeEach(async () => {
  db = await createTestDb();
  const [c1, c2] = await db
    .insert(courses)
    .values([
      { title: "Capstone A", term: "Spring 2027" },
      { title: "Capstone B", term: "Spring 2027" },
    ])
    .returning();
  advisor = await member(c1.id, "Advisor One", "advisor");
  otherAdvisor = await member(c1.id, "Advisor Two", "advisor");
  otherCourseAdvisor = await member(c2.id, "Advisor Elsewhere", "advisor");
  student = await member(c1.id, "Student", "student", advisor.membershipId);
});

const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
const proposal = { problemStatement: "Metal runoff in campus ponds harms aquatic life.", deliverableType: "AI Model & Prediction System", methodology: "Culture isolates, measure uptake, model in Python." };

async function stageStatus(stage: number) {
  const [m] = await db
    .select()
    .from(milestones)
    .where(and(eq(milestones.membershipId, student.membershipId), eq(milestones.stage, stage)));
  return m.status;
}

async function latestSubmissionId(stage: number) {
  const o = await getStudentOverview(db, student.membershipId);
  return o.stages.find((s) => s.stage === stage)!.latestSubmission!.id;
}

describe("capstone workflow", () => {
  it("runs a full track: submit → approve unlocks next → revision → resubmit", async () => {
    await chooseTrack(db, student, "flagship");
    expect(await stageStatus(1)).toBe("open");
    expect(await stageStatus(2)).toBe("locked");

    // Can't skip ahead.
    await expect(submitStage(db, student, 2, proposal)).rejects.toThrow(ServiceError);

    expect(await submitStage(db, student, 1, { theme: "Project 2: AI Prediction of Metal Removal Efficiency" })).toEqual({ ok: true });
    expect(await stageStatus(1)).toBe("submitted");
    // Double submit is rejected.
    await expect(submitStage(db, student, 1, { theme: "Project 2: AI Prediction of Metal Removal Efficiency" })).rejects.toThrow(/awaiting/);

    await reviewSubmission(db, advisor, await latestSubmissionId(1), { decision: "approved" });
    expect(await stageStatus(1)).toBe("approved");
    expect(await stageStatus(2)).toBe("open");

    await submitStage(db, student, 2, proposal);
    const revision = await reviewSubmission(db, advisor, await latestSubmissionId(2), { decision: "revision", comment: "Add sample sizes." });
    expect(revision).toEqual({ ok: true });
    expect(await stageStatus(2)).toBe("revision");
    expect(await stageStatus(3)).toBe("locked");

    await submitStage(db, student, 2, { ...proposal, methodology: proposal.methodology + " n=30 per group." });
    const overview = await getStudentOverview(db, student.membershipId);
    expect(overview.stages[1].submissionCount).toBe(2);
    expect(overview.canChangeTrack).toBe(false);
  });

  it("returns field errors for invalid stage data without changing state", async () => {
    await chooseTrack(db, student, "project");
    const r = await submitStage(db, student, 1, { theme: "Not a real theme" });
    expect(r.ok).toBe(false);
    expect(await stageStatus(1)).toBe("open");
  });

  it("blocks reviewing the same submission twice", async () => {
    await chooseTrack(db, student, "project");
    await submitStage(db, student, 1, { theme: "B. Groundwater & Soil Remediation" });
    const id = await latestSubmissionId(1);
    await reviewSubmission(db, advisor, id, { decision: "approved" });
    await expect(reviewSubmission(db, advisor, id, { decision: "approved" })).rejects.toThrow(/already been reviewed/);
  });

  it("prevents changing track after submitting", async () => {
    await chooseTrack(db, student, "project");
    await submitStage(db, student, 1, { theme: "B. Groundwater & Soil Remediation" });
    await expect(chooseTrack(db, student, "flagship")).rejects.toThrow(/can't change tracks/);
  });

  it("stops students from acting as advisors", async () => {
    await expect(reviewLabLog(db, student, crypto.randomUUID(), { decision: "approved" })).rejects.toThrow(/Only advisors/);
  });
});

describe("lab hours", () => {
  it("logs, verifies and counts only approved hours", async () => {
    expect(await logLabHours(db, student, { date: today, hours: "4.5", location: "SOE Lab 102", activity: "Toxicity test" })).toEqual({ ok: true });
    await logLabHours(db, student, { date: today, hours: "2", location: "Field Site A", activity: "Sampling run" });

    const queue = await getQueue(db, advisor);
    expect(queue.labLogs).toHaveLength(2);

    const [first, second] = queue.labLogs;
    await reviewLabLog(db, advisor, first.log.id, { decision: "approved" });
    await expect(reviewLabLog(db, advisor, second.log.id, { decision: "returned" })).resolves.toMatchObject({ ok: false });
    await reviewLabLog(db, advisor, second.log.id, { decision: "returned", comment: "Needs supervisor sign-off" });

    const o = await getStudentOverview(db, student.membershipId);
    expect(o.hours.approved).toBe(first.log.hours);
    expect(o.hours.pending).toBe(0);
    expect(o.labLogs.find((l) => l.id === second.log.id)?.review?.comment).toBe("Needs supervisor sign-off");

    const report = await verifiedHoursReport(db, advisor);
    expect(report[0].entries).toHaveLength(1);
    expect(report[0].entries[0].approval?.reviewer).toBe("Advisor One");
  });

  it("rejects invalid hours", async () => {
    const r = await logLabHours(db, student, { date: today, hours: "11", location: "Lab", activity: "Too long" });
    expect(r.ok).toBe(false);
    expect(await db.select().from(labLogs)).toHaveLength(0);
  });

  it("notifies the assigned advisor and records an audit review", async () => {
    await logLabHours(db, student, { date: today, hours: "1", location: "Lab", activity: "Calibration" });
    const notes = await db.select().from(notifications);
    expect(notes.map((n) => n.membershipId)).toEqual([advisor.membershipId]);

    const [log] = await db.select().from(labLogs);
    await reviewLabLog(db, advisor, log.id, { decision: "approved" });
    const [audit] = await db.select().from(reviews);
    expect(audit).toMatchObject({ reviewerId: advisor.membershipId, targetId: log.id, decision: "approved" });
  });
});

describe("advisor access control", () => {
  it("hides students assigned to another advisor, and other courses", async () => {
    expect((await visibleStudents(db, advisor)).map((s) => s.name)).toEqual(["Student"]);
    expect(await visibleStudents(db, otherAdvisor)).toHaveLength(0);
    expect(await visibleStudents(db, otherCourseAdvisor)).toHaveLength(0);
  });

  it("shows unassigned students to every advisor in the course", async () => {
    await member(advisor.courseId, "Unassigned", "student");
    expect((await visibleStudents(db, otherAdvisor)).map((s) => s.name)).toEqual(["Unassigned"]);
  });

  it("lets an advisor claim an unassigned student, and hand them to a colleague", async () => {
    const newbie = await member(advisor.courseId, "Unassigned", "student");
    await assignAdvisor(db, otherAdvisor, newbie.membershipId, otherAdvisor.membershipId);
    expect((await visibleStudents(db, otherAdvisor)).map((s) => s.name)).toEqual(["Unassigned"]);
    expect((await visibleStudents(db, advisor)).map((s) => s.name)).toEqual(["Student"]); // no longer unassigned

    await assignAdvisor(db, otherAdvisor, newbie.membershipId, advisor.membershipId);
    const notes = await db.select().from(notifications).where(eq(notifications.membershipId, advisor.membershipId));
    expect(notes.map((n) => n.message)).toContain("Unassigned was assigned to you as an advisee.");
    const studentNotes = await db.select().from(notifications).where(eq(notifications.membershipId, newbie.membershipId));
    expect(studentNotes.map((n) => n.message)).toContain("Advisor One is now your capstone advisor.");
  });

  it("can unassign, but can't touch others' students or assign across courses", async () => {
    await assignAdvisor(db, advisor, student.membershipId, null);
    expect((await visibleStudents(db, otherAdvisor)).map((s) => s.name)).toEqual(["Student"]);

    await assignAdvisor(db, advisor, student.membershipId, advisor.membershipId);
    await expect(assignAdvisor(db, otherAdvisor, student.membershipId, otherAdvisor.membershipId)).rejects.toThrow(/don't have access/);
    await expect(assignAdvisor(db, advisor, student.membershipId, otherCourseAdvisor.membershipId)).rejects.toThrow(/isn't in this course/);
    await expect(assignAdvisor(db, advisor, student.membershipId, student.membershipId)).rejects.toThrow(/isn't in this course/);
  });

  it("forbids reviewing a student you can't see", async () => {
    await logLabHours(db, student, { date: today, hours: "1", location: "Lab", activity: "Calibration" });
    const [log] = await db.select().from(labLogs);
    await expect(reviewLabLog(db, otherAdvisor, log.id, { decision: "approved" })).rejects.toThrow(/don't have access/);
    await expect(reviewLabLog(db, otherCourseAdvisor, log.id, { decision: "approved" })).rejects.toThrow(/don't have access/);
  });
});
