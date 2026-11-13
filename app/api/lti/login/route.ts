import { db } from "@/db";
import { appOrigin, setStateCookie } from "@/lib/auth/session";
import { LaunchError } from "@/lib/lti/claims";
import { startLogin, type LoginParams } from "@/lib/lti/launch";
import { launchErrorRedirect, rateLimited } from "@/lib/lti/http";

/** OIDC third-party-initiated login. Canvas may use GET or POST. */
async function handle(request: Request, params: LoginParams) {
  const limited = await rateLimited(db, request, "lti-login");
  if (limited) return limited;
  try {
    const { redirectUrl, state } = await startLogin(db, params, `${appOrigin(request)}/api/lti/launch`);
    await setStateCookie(state);
    return new Response(null, { status: 302, headers: { Location: redirectUrl, "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof LaunchError) return launchErrorRedirect(request, err);
    throw err;
  }
}

export async function GET(request: Request) {
  return handle(request, Object.fromEntries(new URL(request.url).searchParams) as LoginParams);
}

export async function POST(request: Request) {
  const form = await request.formData();
  return handle(request, Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)])) as LoginParams);
}
