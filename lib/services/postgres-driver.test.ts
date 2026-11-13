// Exercises the production code path, the node-postgres driver over the real Postgres wire
// protocol, plus the production migration runner (scripts/migrate.mjs). The server is
// PGlite exposed through pglite-socket, so no Postgres install is needed.
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { eq } from "drizzle-orm";
import type { Pool } from "pg";
import { createDb, type DB } from "@/db";
import { labLogs, memberships, users } from "@/db/schema";
import { seed } from "@/db/seed";
import { getQueue, reviewLabLog } from "./advisor";
import type { Actor } from "./errors";
import { getStudentOverview, logLabHours } from "./student";

let pglite: PGlite;
let server: PGLiteSocketServer;
let url: string;
let db: DB;

// DATABASE_URL_UNPOOLED is blanked so a developer's .env.local (e.g. Neon) is never used here.
// Async on purpose: the database server runs in this process, so a sync child would deadlock.
async function runMigrations() {
  const { stdout } = await promisify(execFile)(process.execPath, ["scripts/migrate.mjs"], { env: { ...process.env, DATABASE_URL: url, DATABASE_URL_UNPOOLED: "" } });
  return stdout;
}

async function actorFor(name: string): Promise<Actor> {
  const [row] = await db.select({ m: memberships }).from(memberships).innerJoin(users, eq(users.id, memberships.userId)).where(eq(users.name, name));
  return { membershipId: row.m.id, userId: row.m.userId, courseId: row.m.courseId, role: row.m.role };
}

beforeAll(async () => {
  pglite = await PGlite.create();
  server = new PGLiteSocketServer({ db: pglite, port: 0, maxConnections: 10 });
  await server.start();
  url = `postgres://postgres:postgres@${server.getServerConn()}/postgres?sslmode=disable`;
  db = createDb({ url });
}, 60_000);

afterAll(async () => {
  await (db as unknown as { $client: Pool }).$client.end();
  await server.stop();
  await pglite.close();
});

describe("production database path (node-postgres + migrate.mjs)", () => {
  it("applies migrations, and re-running them is a no-op", async () => {
    expect(await runMigrations()).toContain("migrations applied");
    expect(await runMigrations()).toContain("migrations applied");
  });

  it("runs seed data and a transactional workflow over the wire", async () => {
    await seed(db);
    const student = await actorFor("Jordan Rivers");
    const advisor = await actorFor("Dr. Casey Grant");
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());

    expect(await logLabHours(db, student, { date: today, hours: "1.5", location: "SOE Lab 102", activity: "Over-the-wire test" })).toEqual({ ok: true });
    const [entry] = await db.select().from(labLogs).where(eq(labLogs.activity, "Over-the-wire test"));
    expect(typeof entry.hours).toBe("number"); // double precision comes back as a JS number via pg too
    expect(entry.date).toBe(today); // date columns come back as YYYY-MM-DD strings, not Date objects

    expect((await getQueue(db, advisor)).labLogs.map((l) => l.log.id)).toContain(entry.id);
    await reviewLabLog(db, advisor, entry.id, { decision: "approved" });
    expect((await getStudentOverview(db, student.membershipId)).hours.approved).toBe(29.5);
  });
});
