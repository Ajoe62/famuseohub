import { describe, expect, it } from "vitest";
import { labLogSchema, reviewSchema, stageSchema, todayInProgramTz } from "./validation";

const TODAY = "2026-11-12";
const validLog = { date: "2026-11-10", hours: "3.5", location: "SOE Lab 102", activity: "Sensor calibration" };

describe("labLogSchema", () => {
  const schema = labLogSchema(TODAY);

  it("accepts a valid entry and coerces hours", () => {
    expect(schema.parse(validLog).hours).toBe(3.5);
  });

  it.each([
    ["0", "hours"],
    ["10.5", "hours"],
    ["2.25", "hours"],
    ["abc", "hours"],
  ])("rejects hours=%s", (hours, field) => {
    const r = schema.safeParse({ ...validLog, hours });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].path).toEqual([field]);
  });

  it("rejects future dates", () => {
    expect(schema.safeParse({ ...validLog, date: "2026-11-13" }).success).toBe(false);
  });

  it("rejects blank text after trimming", () => {
    expect(schema.safeParse({ ...validLog, location: "   " }).success).toBe(false);
  });
});

describe("stageSchema", () => {
  it("only accepts themes from the student's track", () => {
    expect(stageSchema("flagship", 1).safeParse({ theme: "Project 1: Microbes & Toxic Metal Survival" }).success).toBe(true);
    expect(stageSchema("project", 1).safeParse({ theme: "Project 1: Microbes & Toxic Metal Survival" }).success).toBe(false);
  });

  it("requires http(s) links and rejects javascript: URLs", () => {
    expect(stageSchema("project", 4).safeParse({ slidesUrl: "https://docs.google.com/presentation/d/x" }).success).toBe(true);
    expect(stageSchema("project", 4).safeParse({ slidesUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(stageSchema("project", 4).safeParse({ slidesUrl: "" }).success).toBe(false);
  });

  it("treats an empty optional repo URL as absent", () => {
    const r = stageSchema("flagship", 3).parse({ reportUrl: "https://drive.google.com/file/d/x", repoUrl: "" });
    expect(r).not.toHaveProperty("repoUrl", "");
  });

  it("strips unexpected fields", () => {
    const r = stageSchema("project", 2).parse({ problemStatement: "x".repeat(25), stage: "2", evil: "1" });
    expect(r).toEqual({ problemStatement: "x".repeat(25) });
  });
});

describe("reviewSchema", () => {
  it("requires a comment unless approving", () => {
    expect(reviewSchema.safeParse({ decision: "approved" }).success).toBe(true);
    expect(reviewSchema.safeParse({ decision: "revision", comment: "" }).success).toBe(false);
    expect(reviewSchema.safeParse({ decision: "returned", comment: "Not lab work" }).success).toBe(true);
  });
});

describe("todayInProgramTz", () => {
  it("uses Eastern time, not UTC", () => {
    // 02:00 UTC on Nov 13 is still Nov 12 in Tallahassee.
    expect(todayInProgramTz(new Date("2026-11-13T02:00:00Z"))).toBe("2026-11-12");
  });
});
