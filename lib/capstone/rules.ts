// Pure business rules: no database, no framework. Unit-tested in rules.test.ts.
import type { Stage } from "../curriculum";

export type MilestoneStatus = "locked" | "open" | "submitted" | "revision" | "approved";
export type LabLogStatus = "pending" | "approved" | "returned";

export const MILESTONE_LABELS: Record<MilestoneStatus, string> = {
  locked: "Locked",
  open: "Not Started",
  submitted: "Submitted (Under Review)",
  revision: "Revision Requested",
  approved: "Completed",
};

/** Initial statuses when a student picks a track: stage 1 open, the rest locked. */
export function initialMilestoneStatuses(): Record<Stage, MilestoneStatus> {
  return { 1: "open", 2: "locked", 3: "locked", 4: "locked" };
}

/** A stage accepts a submission only when it is open or sent back for revision. */
export function canSubmit(status: MilestoneStatus): boolean {
  return status === "open" || status === "revision";
}

/**
 * Stage N may be submitted only once stage N-1 is approved.
 * `statuses` maps stage → status for one student.
 */
export function checkSubmission(
  stage: Stage,
  statuses: Partial<Record<Stage, MilestoneStatus>>,
): { ok: true } | { ok: false; reason: string } {
  const status = statuses[stage];
  if (!status) return { ok: false, reason: "Choose a capstone track first." };
  if (stage > 1 && statuses[(stage - 1) as Stage] !== "approved") {
    return { ok: false, reason: `Stage ${stage - 1} must be approved before stage ${stage} can be submitted.` };
  }
  if (!canSubmit(status)) {
    return {
      ok: false,
      reason: status === "submitted" ? "This stage is already awaiting advisor review." : `This stage is ${MILESTONE_LABELS[status].toLowerCase()}.`,
    };
  }
  return { ok: true };
}

/** The stage to unlock after `stage` is approved, if any. */
export function nextStage(stage: Stage): Stage | null {
  return stage < 4 ? ((stage + 1) as Stage) : null;
}

/** A student may switch tracks only before submitting anything. */
export function canChangeTrack(statuses: Partial<Record<Stage, MilestoneStatus>>): boolean {
  return Object.entries(statuses).every(([stage, s]) => (stage === "1" ? s === "open" : s === "locked"));
}

export type HoursSummary = {
  approved: number;
  pending: number;
  required: number;
  /** Approved progress toward the requirement, 0–100. */
  percent: number;
  /** Approved + pending, capped at 100: how far along the student would be if everything pending is approved. */
  projectedPercent: number;
  remaining: number;
  complete: boolean;
};

/** Only approved hours count toward the requirement; pending is reported separately. */
export function summarizeHours(entries: { hours: number; status: LabLogStatus }[], required: number): HoursSummary {
  let approved = 0;
  let pending = 0;
  for (const e of entries) {
    if (e.status === "approved") approved += e.hours;
    else if (e.status === "pending") pending += e.hours;
  }
  const pct = (n: number) => (required > 0 ? Math.min(100, Math.round((n / required) * 100)) : 100);
  return {
    approved,
    pending,
    required,
    percent: pct(approved),
    projectedPercent: pct(approved + pending),
    remaining: Math.max(0, required - approved),
    complete: approved >= required,
  };
}
