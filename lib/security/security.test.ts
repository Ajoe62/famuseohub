import { beforeEach, describe, expect, it } from "vitest";
import type { DB } from "@/db";
import { launchTickets, ltiPlatforms, ltiStates, memberships, rateLimits } from "@/db/schema";
import { createTestDb } from "@/db/testing";
import { seed } from "@/db/seed";
import { describeError } from "../observability";
import { cleanupExpired } from "./cleanup";
import { clientIp, LIMITS, rateLimit } from "./rate-limit";

let db: DB;
beforeEach(async () => {
  db = await createTestDb();
});

const t0 = new Date("2027-02-01T15:00:10Z");

describe("rateLimit", () => {
  it("allows up to the limit in a window, then blocks with Retry-After", async () => {
    const { limit } = LIMITS["lti-ticket"];
    for (let i = 0; i < limit; i++) expect((await rateLimit(db, "lti-ticket", "1.2.3.4", t0)).ok).toBe(true);
    expect(await rateLimit(db, "lti-ticket", "1.2.3.4", t0)).toEqual({ ok: false, retryAfterSeconds: 50 });
  });

  it("counts clients and buckets separately, and resets in the next window", async () => {
    const { limit } = LIMITS["lti-ticket"];
    for (let i = 0; i < limit + 1; i++) await rateLimit(db, "lti-ticket", "1.2.3.4", t0);
    expect((await rateLimit(db, "lti-ticket", "5.6.7.8", t0)).ok).toBe(true);
    expect((await rateLimit(db, "lti-login", "1.2.3.4", t0)).ok).toBe(true);
    expect((await rateLimit(db, "lti-ticket", "1.2.3.4", new Date(t0.getTime() + 60_000))).ok).toBe(true);
  });

  it("never stores the raw IP address", async () => {
    await rateLimit(db, "lti-login", "203.0.113.7", t0);
    const [row] = await db.select().from(rateLimits);
    expect(row.key).toMatch(/^lti-login:/);
    expect(row.key).not.toContain("203.0.113.7");
  });

  it("reads the client IP from proxy headers", () => {
    expect(clientIp(new Request("http://x", { headers: { "x-real-ip": "9.9.9.9", "x-forwarded-for": "1.1.1.1" } }))).toBe("9.9.9.9");
    expect(clientIp(new Request("http://x", { headers: { "x-forwarded-for": "1.1.1.1, 10.0.0.1" } }))).toBe("1.1.1.1");
    expect(clientIp(new Request("http://x"))).toBe("unknown");
  });
});

describe("cleanupExpired", () => {
  it("deletes only expired states, tickets and old rate-limit windows", async () => {
    await seed(db);
    const [platform] = await db
      .insert(ltiPlatforms)
      .values({ name: "T", issuer: "https://t", clientId: "c", authUrl: "https://t/a", tokenUrl: "https://t/t", jwksUrl: "https://t/j" })
      .returning();
    const [m] = await db.select().from(memberships).limit(1);
    const past = new Date(t0.getTime() - 1000);
    const future = new Date(t0.getTime() + 60_000);
    await db.insert(ltiStates).values([
      { state: "old", nonce: "n", platformId: platform.id, expiresAt: past },
      { state: "live", nonce: "n", platformId: platform.id, expiresAt: future },
    ]);
    await db.insert(launchTickets).values([
      { tokenHash: "old", membershipId: m.id, expiresAt: past },
      { tokenHash: "live", membershipId: m.id, expiresAt: future },
    ]);
    await db.insert(rateLimits).values([
      { key: "a", windowStart: new Date(t0.getTime() - 2 * 60 * 60 * 1000) },
      { key: "b", windowStart: t0 },
    ]);

    expect(await cleanupExpired(db, t0)).toEqual({ ltiStates: 1, launchTickets: 1, rateLimits: 1 });
    expect((await db.select().from(ltiStates)).map((r) => r.state)).toEqual(["live"]);
    expect((await db.select().from(launchTickets)).map((r) => r.tokenHash)).toEqual(["live"]);
    expect((await db.select().from(rateLimits)).map((r) => r.key)).toEqual(["b"]);
  });
});

describe("describeError", () => {
  it("drops the query string (it can carry a launch ticket) and keeps no headers", () => {
    const report = describeError(new Error("boom"), { path: "/lti/landing?t=secret-ticket", method: "GET" }, { routePath: "/lti/landing", routeType: "render" });
    expect(report.path).toBe("/lti/landing");
    expect(JSON.stringify(report)).not.toContain("secret-ticket");
    expect(report).not.toHaveProperty("headers");
    expect(report.message).toBe("boom");
  });
});
