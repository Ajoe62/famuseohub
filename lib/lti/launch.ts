import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";
import type { DB } from "@/db";
import { courses, launchTickets, ltiDeployments, ltiPlatforms, ltiStates, memberships, users, type LtiPlatform } from "@/db/schema";
import { appRoleFromLti, CLAIM, displayName, LaunchError, type LaunchClaims } from "./claims";

const STATE_TTL_MS = 10 * 60 * 1000;
const TICKET_TTL_MS = 2 * 60 * 1000;
const randomToken = () => randomBytes(32).toString("base64url");
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

// ---------------------------------------------------------------------------
// Step 1: OIDC login initiation (Canvas → /api/lti/login)
// ---------------------------------------------------------------------------

export type LoginParams = {
  iss?: string;
  login_hint?: string;
  target_link_uri?: string;
  lti_message_hint?: string;
  client_id?: string;
  lti_deployment_id?: string;
};

export async function findPlatform(db: DB, issuer: string, clientId?: string): Promise<LtiPlatform> {
  const rows = await db
    .select()
    .from(ltiPlatforms)
    .where(clientId ? and(eq(ltiPlatforms.issuer, issuer), eq(ltiPlatforms.clientId, clientId)) : eq(ltiPlatforms.issuer, issuer));
  // Without client_id, the issuer must be unambiguous.
  if (rows.length !== 1) throw new LaunchError("unknown_platform", `No unique platform for iss=${issuer} client_id=${clientId ?? "-"}`);
  return rows[0];
}

/** Validates the login request, stores single-use state + nonce, and returns where to redirect. */
export async function startLogin(db: DB, params: LoginParams, redirectUri: string) {
  if (!params.iss || !params.login_hint) throw new LaunchError("invalid_state", "Login request missing iss or login_hint");
  const platform = await findPlatform(db, params.iss, params.client_id);

  const state = randomToken();
  const nonce = randomToken();
  const now = Date.now();
  await db.delete(ltiStates).where(lt(ltiStates.expiresAt, new Date(now))); // housekeeping
  await db.delete(launchTickets).where(lt(launchTickets.expiresAt, new Date(now)));
  await db.insert(ltiStates).values({ state, nonce, platformId: platform.id, expiresAt: new Date(now + STATE_TTL_MS) });

  const url = new URL(platform.authUrl);
  const q = url.searchParams;
  q.set("scope", "openid");
  q.set("response_type", "id_token");
  q.set("response_mode", "form_post");
  q.set("prompt", "none");
  q.set("client_id", platform.clientId);
  q.set("redirect_uri", redirectUri);
  q.set("login_hint", params.login_hint);
  q.set("state", state);
  q.set("nonce", nonce);
  if (params.lti_message_hint) q.set("lti_message_hint", params.lti_message_hint);
  return { redirectUrl: url.toString(), state };
}

// ---------------------------------------------------------------------------
// Step 2: launch (Canvas POSTs id_token + state → /api/lti/launch)
// ---------------------------------------------------------------------------

const jwksCache = new Map<string, JWTVerifyGetKey>();
function remoteJwks(url: string) {
  let jwks = jwksCache.get(url);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(url), { timeoutDuration: 10_000, cooldownDuration: 30_000 });
    jwksCache.set(url, jwks);
  }
  return jwks;
}

export type LaunchInput = {
  idToken: string;
  state: string;
  /** The state cookie set at login, when the browser kept it. Must match if present. */
  stateCookie?: string;
};

/** Verifies the launch message. Throws LaunchError on any failure. */
export async function verifyLaunch(db: DB, input: LaunchInput, getKey?: (p: LtiPlatform) => JWTVerifyGetKey) {
  if (!input.idToken || !input.state) throw new LaunchError("invalid_state", "Missing id_token or state");
  if (input.stateCookie && input.stateCookie !== input.state) throw new LaunchError("invalid_state", "State cookie mismatch");

  // Consume the state atomically: a replayed launch finds nothing.
  const [stored] = await db
    .delete(ltiStates)
    .where(and(eq(ltiStates.state, input.state), gt(ltiStates.expiresAt, new Date())))
    .returning();
  if (!stored) throw new LaunchError("invalid_state", "Unknown, expired or reused state");

  const [platform] = await db.select().from(ltiPlatforms).where(eq(ltiPlatforms.id, stored.platformId));
  if (!platform) throw new LaunchError("unknown_platform", "Platform removed during launch");

  let claims: LaunchClaims;
  try {
    const { payload } = await jwtVerify(input.idToken, getKey ? getKey(platform) : remoteJwks(platform.jwksUrl), {
      issuer: platform.issuer,
      audience: platform.clientId,
      algorithms: ["RS256", "RS384", "RS512", "ES256"],
      clockTolerance: 60,
      requiredClaims: ["sub", "exp", "iat", "nonce"],
    });
    claims = payload as unknown as LaunchClaims;
  } catch (err) {
    throw new LaunchError("invalid_token", `id_token verification failed: ${err instanceof Error ? err.message : err}`);
  }

  if (claims.nonce !== stored.nonce) throw new LaunchError("invalid_token", "Nonce mismatch");
  const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if ((aud.length > 1 || claims.azp) && claims.azp !== platform.clientId) throw new LaunchError("invalid_token", "azp mismatch");
  if (claims[CLAIM.version] !== "1.3.0") throw new LaunchError("unsupported_message", `LTI version ${claims[CLAIM.version]}`);
  if (claims[CLAIM.messageType] !== "LtiResourceLinkRequest") {
    throw new LaunchError("unsupported_message", `Message type ${claims[CLAIM.messageType]}`);
  }

  const deploymentId = claims[CLAIM.deploymentId];
  const [deployment] = deploymentId
    ? await db
        .select()
        .from(ltiDeployments)
        .where(and(eq(ltiDeployments.platformId, platform.id), eq(ltiDeployments.deploymentId, deploymentId)))
    : [];
  if (!deployment) throw new LaunchError("unknown_deployment", `Deployment ${deploymentId} not registered for ${platform.name}`);

  return { platform, claims };
}

/**
 * Creates or updates the user, course and membership from verified claims.
 * Roles are refreshed on every launch, so Canvas stays the source of truth.
 * Email is deliberately not stored (data minimisation).
 */
export async function provisionFromLaunch(db: DB, claims: LaunchClaims) {
  const role = appRoleFromLti(claims[CLAIM.roles]);
  if (!role) throw new LaunchError("role_not_allowed", `Roles not allowed: ${(claims[CLAIM.roles] ?? []).join(",")}`);
  const context = claims[CLAIM.context];
  if (!context?.id) throw new LaunchError("missing_context", "No course context in launch");
  const custom = claims[CLAIM.custom] ?? {};
  // Unsubstituted Canvas variables come through literally, e.g. "$Canvas.term.name".
  const term = custom.canvas_term_name && !custom.canvas_term_name.startsWith("$") ? custom.canvas_term_name : "";

  return db.transaction(async (tx) => {
    const name = displayName(claims);
    const [user] = await tx
      .insert(users)
      .values({ name, ltiIssuer: claims.iss, ltiSub: claims.sub })
      .onConflictDoUpdate({ target: [users.ltiIssuer, users.ltiSub], set: { name } })
      .returning();

    const title = context.title || context.label || "Canvas course";
    const [course] = await tx
      .insert(courses)
      .values({ ltiIssuer: claims.iss, ltiContextId: context.id, title, term })
      .onConflictDoUpdate({
        target: [courses.ltiIssuer, courses.ltiContextId],
        set: term ? { title, term } : { title },
      })
      .returning();

    const [existing] = await tx
      .select()
      .from(memberships)
      .where(and(eq(memberships.userId, user.id), eq(memberships.courseId, course.id)));
    if (existing) {
      if (existing.role !== role) {
        // Role changed in Canvas (e.g. a student became a TA). Advisors have no assigned advisor.
        await tx.update(memberships).set({ role, advisorId: role === "advisor" ? null : existing.advisorId }).where(eq(memberships.id, existing.id));
      }
      return { membershipId: existing.id, role };
    }
    const [created] = await tx.insert(memberships).values({ userId: user.id, courseId: course.id, role }).returning();
    return { membershipId: created.id, role };
  });
}

// ---------------------------------------------------------------------------
// Blocked-cookie fallback: continue the launch in a new top-level tab
// ---------------------------------------------------------------------------

export async function issueLaunchTicket(db: DB, membershipId: string) {
  const token = randomToken();
  await db.insert(launchTickets).values({ tokenHash: sha256(token), membershipId, expiresAt: new Date(Date.now() + TICKET_TTL_MS) });
  return token;
}

/** Returns the membership for a valid ticket and deletes it (single use). */
export async function redeemLaunchTicket(db: DB, token: string) {
  if (!token) return null;
  const [row] = await db
    .delete(launchTickets)
    .where(and(eq(launchTickets.tokenHash, sha256(token)), gt(launchTickets.expiresAt, new Date())))
    .returning();
  return row?.membershipId ?? null;
}
