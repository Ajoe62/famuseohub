import { createHmac } from "node:crypto";
import { sql } from "drizzle-orm";
import type { DB } from "@/db";
import { rateLimits } from "@/db/schema";

/**
 * Fixed-window rate limits for the public LTI endpoints, stored in Postgres so every serverless
 * instance sees the same counts. Limits are generous on purpose: a whole class on campus Wi-Fi
 * can share one public IP and open the hub at the same moment.
 */
export const LIMITS = {
  "lti-login": { limit: 120, windowSeconds: 60 },
  "lti-launch": { limit: 120, windowSeconds: 60 },
  "lti-ticket": { limit: 60, windowSeconds: 60 },
} as const;

export type Bucket = keyof typeof LIMITS;
export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

/** Client IP as reported by the platform proxy (Vercel sets both headers and overwrites spoofed ones). */
export function clientIp(request: Request): string {
  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return real;
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/** Keyed hash so raw IP addresses are never stored. */
function hashClient(client: string): string {
  const key = process.env.SESSION_SECRET || "dev-only-rate-limit-key";
  return createHmac("sha256", key).update(client).digest("base64url").slice(0, 22);
}

export async function rateLimit(db: DB, bucket: Bucket, client: string, now = new Date()): Promise<RateLimitResult> {
  const { limit, windowSeconds } = LIMITS[bucket];
  const windowMs = windowSeconds * 1000;
  const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs);
  try {
    const [row] = await db
      .insert(rateLimits)
      .values({ key: `${bucket}:${hashClient(client)}`, windowStart, count: 1 })
      .onConflictDoUpdate({ target: [rateLimits.key, rateLimits.windowStart], set: { count: sql`${rateLimits.count} + 1` } })
      .returning({ count: rateLimits.count });
    if (row.count <= limit) return { ok: true };
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((windowStart.getTime() + windowMs - now.getTime()) / 1000)) };
  } catch (err) {
    // Fail open: a counter problem must not lock everyone out of Canvas launches.
    console.error("[rate-limit] counter unavailable:", err instanceof Error ? err.message : err);
    return { ok: true };
  }
}
