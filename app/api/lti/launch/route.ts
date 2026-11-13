import { db } from "@/db";
import { appOrigin, createSession, takeStateCookie } from "@/lib/auth/session";
import { LaunchError } from "@/lib/lti/claims";
import { issueLaunchTicket, provisionFromLaunch, verifyLaunch } from "@/lib/lti/launch";
import { launchErrorRedirect, rateLimited } from "@/lib/lti/http";

/** Canvas POSTs the signed id_token here (response_mode=form_post). */
export async function POST(request: Request) {
  const limited = await rateLimited(db, request, "lti-launch");
  if (limited) return limited;
  try {
    const form = await request.formData();
    if (form.get("error")) {
      throw new LaunchError("platform_error", `Platform returned ${form.get("error")}: ${form.get("error_description") ?? ""}`);
    }
    const { claims } = await verifyLaunch(db, {
      idToken: String(form.get("id_token") ?? ""),
      state: String(form.get("state") ?? ""),
      stateCookie: await takeStateCookie(),
    });
    const { membershipId } = await provisionFromLaunch(db, claims);

    await createSession(membershipId);
    // If the browser drops the session cookie in the iframe, the landing page uses this
    // single-use ticket to continue in a new tab.
    const ticket = await issueLaunchTicket(db, membershipId);

    // 303 so the browser follows with a GET (a 307 would re-POST the form).
    return new Response(null, {
      status: 303,
      headers: { Location: `${appOrigin(request)}/lti/landing?t=${ticket}`, "Cache-Control": "no-store" },
    });
  } catch (err) {
    if (err instanceof LaunchError) return launchErrorRedirect(request, err);
    throw err;
  }
}
