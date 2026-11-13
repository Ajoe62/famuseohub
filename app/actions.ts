"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { memberships } from "@/db/schema";
import { createSession, destroySession, devLoginEnabled, requireActor } from "@/lib/auth/session";
import { STAGES, type Stage, type Track } from "@/lib/curriculum";
import { formToObject, validationFailure, type ActionResult } from "@/lib/capstone/validation";
import { assignAdvisor, reviewLabLog, reviewSubmission } from "@/lib/services/advisor";
import { ServiceError } from "@/lib/services/errors";
import { markAllRead } from "@/lib/services/notifications";
import { chooseTrack, logLabHours, submitStage } from "@/lib/services/student";
import type { ZodError } from "zod";

type ServiceResult = { ok: true } | { ok: false; error: ZodError } | void;

/** Runs a mutation, maps expected failures to a user-facing result, and refreshes the UI. */
async function run(successMessage: string, fn: () => Promise<ServiceResult>): Promise<ActionResult> {
  try {
    const result = await fn();
    if (result && !result.ok) return validationFailure(result.error);
  } catch (err) {
    if (err instanceof ServiceError) return { ok: false, message: err.message };
    console.error("Unexpected action error", err instanceof Error ? err.message : err);
    return { ok: false, message: "Something went wrong. Please try again." };
  }
  revalidatePath("/", "layout");
  return { ok: true, message: successMessage };
}

export async function chooseTrackAction(_prev: ActionResult | null, formData: FormData) {
  const actor = await requireActor("student");
  const track = formData.get("track") as Track;
  return run("Track selected. Stage 1 is open.", () => chooseTrack(db, actor, track));
}

export async function submitStageAction(_prev: ActionResult | null, formData: FormData) {
  const actor = await requireActor("student");
  const stage = Number(formData.get("stage")) as Stage;
  if (!STAGES.includes(stage)) return { ok: false, message: "Unknown stage." };
  return run("Submitted for advisor review.", () => submitStage(db, actor, stage, formToObject(formData)));
}

export async function logLabHoursAction(_prev: ActionResult | null, formData: FormData) {
  const actor = await requireActor("student");
  return run("Lab hours logged and sent to your advisor for verification.", () =>
    logLabHours(db, actor, formToObject(formData)),
  );
}

export async function reviewSubmissionAction(_prev: ActionResult | null, formData: FormData) {
  const actor = await requireActor("advisor");
  const id = String(formData.get("submissionId") ?? "");
  const approved = formData.get("decision") === "approved";
  return run(approved ? "Approved. The next stage is unlocked." : "Revision requested.", () =>
    reviewSubmission(db, actor, id, formToObject(formData)),
  );
}

export async function reviewLabLogAction(_prev: ActionResult | null, formData: FormData) {
  const actor = await requireActor("advisor");
  const id = String(formData.get("labLogId") ?? "");
  const approved = formData.get("decision") === "approved";
  return run(approved ? "Lab hours verified." : "Entry returned to the student.", () =>
    reviewLabLog(db, actor, id, formToObject(formData)),
  );
}

export async function assignAdvisorAction(_prev: ActionResult | null, formData: FormData) {
  const actor = await requireActor("advisor");
  const studentId = String(formData.get("studentId") ?? "");
  const to = String(formData.get("advisorId") ?? "");
  return run(to ? "Advisor assigned." : "Student unassigned.", () => assignAdvisor(db, actor, studentId, to || null));
}

export async function markNotificationsReadAction() {
  const actor = await requireActor();
  await markAllRead(db, actor.membershipId);
  revalidatePath("/", "layout");
}

export async function devLoginAction(formData: FormData) {
  if (!devLoginEnabled()) throw new Error("Dev login is disabled.");
  const id = String(formData.get("membershipId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect("/dev/login");
  const [m] = await db.select().from(memberships).where(eq(memberships.id, id));
  if (!m) redirect("/dev/login");
  await createSession(m.id);
  redirect(m.role === "advisor" ? "/advisor" : "/");
}

export async function logoutAction() {
  await destroySession();
  redirect(devLoginEnabled() ? "/dev/login" : "/launch-required");
}
