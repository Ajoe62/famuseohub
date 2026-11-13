import { eq } from "drizzle-orm";
import { db } from "@/db";
import { memberships } from "@/db/schema";
import { appOrigin, createSession } from "@/lib/auth/session";
import { rateLimited } from "@/lib/lti/http";
import { redeemLaunchTicket } from "@/lib/lti/launch";

/** Opened in a new top-level tab when the iframe couldn't keep cookies. Single use. */
export async function GET(request: Request) {
  const limited = await rateLimited(db, request, "lti-ticket");
  if (limited) return limited;
  const origin = appOrigin(request);
  const membershipId = await redeemLaunchTicket(db, new URL(request.url).searchParams.get("t") ?? "");
  if (!membershipId) {
    return Response.redirect(`${origin}/launch-required?reason=invalid_state`, 303);
  }
  const [m] = await db.select().from(memberships).where(eq(memberships.id, membershipId));
  await createSession(membershipId);
  return new Response(null, {
    status: 303,
    headers: { Location: `${origin}${m?.role === "advisor" ? "/advisor" : "/"}`, "Cache-Control": "no-store" },
  });
}
