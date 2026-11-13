import type { DB } from "@/db";
import { appOrigin } from "@/lib/auth/session";
import { clientIp, rateLimit, type Bucket } from "@/lib/security/rate-limit";
import type { LaunchError } from "./claims";

/** Logs the detail server-side (no tokens) and sends the user to a friendly error page. */
export function launchErrorRedirect(request: Request, err: LaunchError) {
  console.warn(`[lti] launch rejected (${err.code}): ${err.message}`);
  return new Response(null, {
    status: 303,
    headers: { Location: `${appOrigin(request)}/launch-required?reason=${err.code}`, "Cache-Control": "no-store" },
  });
}

/** Returns a redirect to the friendly error page when this client is over its limit, else null. */
export async function rateLimited(db: DB, request: Request, bucket: Bucket): Promise<Response | null> {
  const result = await rateLimit(db, bucket, clientIp(request));
  if (result.ok) return null;
  console.warn(`[lti] rate limited (${bucket})`);
  return new Response(null, {
    status: 303,
    headers: {
      Location: `${appOrigin(request)}/launch-required?reason=rate_limited`,
      "Retry-After": String(result.retryAfterSeconds),
      "Cache-Control": "no-store",
    },
  });
}
