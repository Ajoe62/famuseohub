import { lt } from "drizzle-orm";
import type { DB } from "@/db";
import { launchTickets, ltiStates, rateLimits } from "@/db/schema";

/** Rate-limit windows are one minute; keep an hour so a burst is still visible when debugging. */
const RATE_LIMIT_RETENTION_MS = 60 * 60 * 1000;

/**
 * Deletes short-lived rows that are no longer useful: expired LTI login states (10 minutes),
 * expired new-tab launch tickets (2 minutes) and old rate-limit windows. Logins already clear
 * expired states and tickets; this daily job (Vercel Cron) covers quiet periods and rate limits.
 */
export async function cleanupExpired(db: DB, now = new Date()) {
  const states = await db.delete(ltiStates).where(lt(ltiStates.expiresAt, now)).returning({ id: ltiStates.state });
  const tickets = await db.delete(launchTickets).where(lt(launchTickets.expiresAt, now)).returning({ id: launchTickets.tokenHash });
  const limits = await db
    .delete(rateLimits)
    .where(lt(rateLimits.windowStart, new Date(now.getTime() - RATE_LIMIT_RETENTION_MS)))
    .returning({ key: rateLimits.key });
  return { ltiStates: states.length, launchTickets: tickets.length, rateLimits: limits.length };
}
