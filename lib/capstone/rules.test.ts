import { describe, expect, it } from "vitest";
import { canChangeTrack, checkSubmission, initialMilestoneStatuses, nextStage, summarizeHours } from "./rules";

describe("stage gating", () => {
  it("opens only stage 1 initially", () => {
    expect(initialMilestoneStatuses()).toEqual({ 1: "open", 2: "locked", 3: "locked", 4: "locked" });
  });

  it("allows submitting an open stage 1", () => {
    expect(checkSubmission(1, initialMilestoneStatuses())).toEqual({ ok: true });
  });

  it("blocks stage N until stage N-1 is approved", () => {
    const r = checkSubmission(2, { 1: "submitted", 2: "open", 3: "locked", 4: "locked" });
    expect(r.ok).toBe(false);
  });

  it("blocks stage N even if forced open while stage N-1 is not approved", () => {
    expect(checkSubmission(3, { 1: "approved", 2: "revision", 3: "open", 4: "locked" }).ok).toBe(false);
  });

  it("allows resubmission after a revision request", () => {
    expect(checkSubmission(2, { 1: "approved", 2: "revision", 3: "locked", 4: "locked" })).toEqual({ ok: true });
  });

  it("blocks double submission while under review", () => {
    const r = checkSubmission(1, { 1: "submitted", 2: "locked", 3: "locked", 4: "locked" });
    expect(r).toEqual({ ok: false, reason: "This stage is already awaiting advisor review." });
  });

  it("requires a track", () => {
    expect(checkSubmission(1, {}).ok).toBe(false);
  });

  it("unlocks the following stage, and nothing after stage 4", () => {
    expect(nextStage(1)).toBe(2);
    expect(nextStage(4)).toBeNull();
  });

  it("lets students change track only before submitting", () => {
    expect(canChangeTrack(initialMilestoneStatuses())).toBe(true);
    expect(canChangeTrack({ 1: "submitted", 2: "locked", 3: "locked", 4: "locked" })).toBe(false);
  });
});

describe("summarizeHours", () => {
  it("counts only approved hours toward the requirement", () => {
    const s = summarizeHours(
      [
        { hours: 4.5, status: "approved" },
        { hours: 3, status: "pending" },
        { hours: 2, status: "returned" },
      ],
      50,
    );
    expect(s).toMatchObject({ approved: 4.5, pending: 3, percent: 9, projectedPercent: 15, remaining: 45.5, complete: false });
  });

  it("caps percentages at 100", () => {
    const s = summarizeHours([{ hours: 60, status: "approved" }, { hours: 10, status: "pending" }], 50);
    expect(s.percent).toBe(100);
    expect(s.projectedPercent).toBe(100);
    expect(s.remaining).toBe(0);
    expect(s.complete).toBe(true);
  });
});
