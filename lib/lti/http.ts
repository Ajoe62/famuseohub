import { appOrigin } from "@/lib/auth/session";
import type { LaunchError } from "./claims";

/** Logs the detail server-side (no tokens) and sends the user to a friendly error page. */
export function launchErrorRedirect(request: Request, err: LaunchError) {
  console.warn(`[lti] launch rejected (${err.code}): ${err.message}`);
  return new Response(null, {
    status: 303,
    headers: { Location: `${appOrigin(request)}/launch-required?reason=${err.code}`, "Cache-Control": "no-store" },
  });
}
