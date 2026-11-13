import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify, SignJWT } from "jose";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { memberships } from "@/db/schema";
import type { Actor } from "../services/errors";

const COOKIE = "famu_session";
const STATE_COOKIE = "famu_lti_state";
const MAX_AGE_SECONDS = 8 * 60 * 60;
const isProd = process.env.NODE_ENV === "production";

/**
 * Cookies for the Canvas iframe must be SameSite=None + Secure (+ Partitioned/CHIPS so they
 * survive third-party-cookie blocking). That's required in production, and also when testing
 * against Canvas in development through an HTTPS tunnel (APP_URL=https://...).
 */
function crossSiteCookies() {
  return isProd || Boolean(process.env.APP_URL?.startsWith("https://"));
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    path: "/",
    maxAge,
    ...(crossSiteCookies() ? { secure: true, sameSite: "none" as const, partitioned: true } : { sameSite: "lax" as const }),
  };
}

/** Public base URL of the app, used for LTI redirect URIs and the Canvas config. */
export function appOrigin(request: Request) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const url = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;
  return `${proto}://${host}`;
}

/** Binds the OIDC login to this browser when the browser keeps the cookie (best effort in iframes). */
export async function setStateCookie(state: string) {
  (await cookies()).set(STATE_COOKIE, state, cookieOptions(10 * 60));
}

export async function takeStateCookie() {
  const store = await cookies();
  const value = store.get(STATE_COOKIE)?.value;
  if (value) store.delete(STATE_COOKIE);
  return value;
}

/** The dev login page (pick a seeded user) is never available in production unless explicitly enabled. */
export function devLoginEnabled() {
  return !isProd || process.env.ENABLE_DEV_LOGIN === "true";
}

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value) {
    if (isProd) throw new Error("SESSION_SECRET must be set in production.");
    return new TextEncoder().encode("dev-only-insecure-session-secret-change-me");
  }
  if (value.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters.");
  return new TextEncoder().encode(value);
}

/** Starts a session for a course membership. Called by the LTI launch and the dev login. */
export async function createSession(membershipId: string) {
  const token = await new SignJWT({ mid: membershipId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret());
  (await cookies()).set(COOKIE, token, cookieOptions(MAX_AGE_SECONDS));
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

/** The signed-in course membership, or null. Re-reads the membership so removed users lose access. */
export const getActor = cache(async (): Promise<Actor | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (typeof payload.mid !== "string") return null;
    const [m] = await db.select().from(memberships).where(eq(memberships.id, payload.mid));
    return m ? { membershipId: m.id, userId: m.userId, courseId: m.courseId, role: m.role } : null;
  } catch {
    return null;
  }
});

export async function requireActor(role?: Actor["role"]): Promise<Actor> {
  const actor = await getActor();
  if (!actor) redirect(devLoginEnabled() ? "/dev/login" : "/launch-required");
  if (role && actor.role !== role) redirect(actor.role === "advisor" ? "/advisor" : "/");
  return actor;
}
