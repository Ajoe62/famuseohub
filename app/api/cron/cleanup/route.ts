import { timingSafeEqual } from "node:crypto";
import { db } from "@/db";
import { cleanupExpired } from "@/lib/security/cleanup";

/**
 * Daily housekeeping, scheduled in vercel.json. Vercel Cron calls this with
 * `Authorization: Bearer $CRON_SECRET`; without CRON_SECRET configured the job is disabled.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ ok: false, error: "CRON_SECRET is not configured" }, { status: 503 });

  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const deleted = await cleanupExpired(db);
  console.log(`[cron] cleanup deleted ${JSON.stringify(deleted)}`);
  return Response.json({ ok: true, deleted }, { headers: { "Cache-Control": "no-store" } });
}
