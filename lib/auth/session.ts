import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify, SignJWT } from "jose";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { memberships } from "@/db/schema";
import type { Actor } from "../services/errors";

const COOKIE = "famu_session";
const MAX_AGE_SECONDS = 8 * 60 * 60;
const isProd = process.env.NODE_ENV === "production";

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

/**
 * Starts a session for a course membership. Called by the dev login today, and by the
 * LTI launch handler later. Inside Canvas the app runs in a cross-site iframe, so in
 * production the cookie must be SameSite=None + Secure, and Partitioned (CHIPS) so
 * browsers that block third-party cookies still keep it.
 */
export async function createSession(membershipId: string) {
  const token = await new SignJWT({ mid: membershipId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    path: "/",
    maxAge: MAX_AGE_SECONDS,
    ...(isProd ? { secure: true, sameSite: "none", partitioned: true } : { sameSite: "lax" }),
  });
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
