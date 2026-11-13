import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type CryptoKey, type JWK } from "jose";
import type { DB } from "@/db";
import { createTestDb } from "@/db/testing";
import { launchTickets, ltiDeployments, ltiPlatforms, memberships, users } from "@/db/schema";
import { appRoleFromLti, CLAIM, LaunchError } from "./claims";
import { issueLaunchTicket, provisionFromLaunch, redeemLaunchTicket, startLogin, verifyLaunch } from "./launch";

const ISS = "https://canvas.test.example";
const CLIENT_ID = "10000000000042";
const DEPLOYMENT = "42:abc";
const REDIRECT = "https://hub.example/api/lti/launch";
const ROLE = {
  learner: "http://purl.imsglobal.org/vocab/lis/v2/membership#Learner",
  instructor: "http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor",
  ta: "http://purl.imsglobal.org/vocab/lis/v2/membership/Instructor#TeachingAssistant",
  mentor: "http://purl.imsglobal.org/vocab/lis/v2/membership#Mentor",
  instAdmin: "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Administrator",
};

let db: DB;
let platformKey: CryptoKey;
let attackerKey: CryptoKey;
let jwks: ReturnType<typeof createLocalJWKSet>;

beforeAll(async () => {
  const kp = await generateKeyPair("RS256");
  platformKey = kp.privateKey;
  attackerKey = (await generateKeyPair("RS256")).privateKey;
  const pub: JWK = { ...(await exportJWK(kp.publicKey)), kid: "platform-1", alg: "RS256" };
  jwks = createLocalJWKSet({ keys: [pub] });
});

beforeEach(async () => {
  db = await createTestDb();
  const [p] = await db
    .insert(ltiPlatforms)
    .values({ name: "Test Canvas", issuer: ISS, clientId: CLIENT_ID, authUrl: `${ISS}/auth`, tokenUrl: `${ISS}/token`, jwksUrl: `${ISS}/jwks` })
    .returning();
  await db.insert(ltiDeployments).values({ platformId: p.id, deploymentId: DEPLOYMENT });
});

type Overrides = Record<string, unknown> & { key?: CryptoKey; expiresIn?: string };

/** Plays the platform: initiate login, then sign an id_token for the returned nonce. */
async function launch(overrides: Overrides = {}) {
  const { redirectUrl, state } = await startLogin(db, { iss: ISS, login_hint: "hint", client_id: CLIENT_ID }, REDIRECT);
  const nonce = new URL(redirectUrl).searchParams.get("nonce")!;
  const { key = platformKey, expiresIn = "5m", ...claims } = overrides;
  const idToken = await new SignJWT({
    nonce,
    name: "Jordan Rivers",
    [CLAIM.messageType]: "LtiResourceLinkRequest",
    [CLAIM.version]: "1.3.0",
    [CLAIM.deploymentId]: DEPLOYMENT,
    [CLAIM.roles]: [ROLE.learner],
    [CLAIM.context]: { id: "course-ctx-1", title: "EVR 4910 Capstone" },
    [CLAIM.custom]: { canvas_term_name: "Spring 2027" },
    ...claims,
  })
    .setProtectedHeader({ alg: "RS256", kid: "platform-1" })
    .setIssuer((claims.iss as string) ?? ISS)
    .setAudience((claims.aud as string | string[]) ?? CLIENT_ID)
    .setSubject((claims.sub as string) ?? "canvas-user-1")
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);
  return { idToken, state };
}

const verify = (input: { idToken: string; state: string; stateCookie?: string }) => verifyLaunch(db, input, () => jwks);

async function expectLaunchError(promise: Promise<unknown>, code: LaunchError["code"]) {
  await expect(promise).rejects.toMatchObject({ name: "LaunchError", code });
}

describe("appRoleFromLti", () => {
  it.each([
    [[ROLE.learner], "student"],
    [[ROLE.instructor], "advisor"],
    [[ROLE.ta], "advisor"],
    [[ROLE.learner, ROLE.ta], "advisor"],
    [[ROLE.mentor], null],
    [[ROLE.instAdmin], null], // institution role alone doesn't grant course access
    [[], null],
  ])("%j → %s", (roles, expected) => {
    expect(appRoleFromLti(roles)).toBe(expected);
  });
});

describe("startLogin", () => {
  it("redirects to the platform with state, nonce and OIDC params", async () => {
    const { redirectUrl } = await startLogin(db, { iss: ISS, login_hint: "h", lti_message_hint: "m", client_id: CLIENT_ID }, REDIRECT);
    const q = new URL(redirectUrl).searchParams;
    expect(redirectUrl.startsWith(`${ISS}/auth?`)).toBe(true);
    expect(Object.fromEntries(q)).toMatchObject({
      scope: "openid",
      response_type: "id_token",
      response_mode: "form_post",
      prompt: "none",
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT,
      login_hint: "h",
      lti_message_hint: "m",
    });
    expect(q.get("state")).toHaveLength(43);
    expect(q.get("nonce")).toHaveLength(43);
  });

  it("rejects unknown platforms", async () => {
    await expectLaunchError(startLogin(db, { iss: "https://evil.example", login_hint: "h" }, REDIRECT), "unknown_platform");
  });
});

describe("launch", () => {
  it("verifies, provisions a student, and is idempotent across launches", async () => {
    const first = await provisionFromLaunch(db, (await verify(await launch())).claims);
    expect(first.role).toBe("student");

    const again = await provisionFromLaunch(db, (await verify(await launch({ name: "Jordan R. Rivers" }))).claims);
    expect(again.membershipId).toBe(first.membershipId);
    const [u] = await db.select().from(users);
    expect(u).toMatchObject({ name: "Jordan R. Rivers", ltiIssuer: ISS, ltiSub: "canvas-user-1", email: null });
  });

  it("updates the role when Canvas changes it", async () => {
    const a = await provisionFromLaunch(db, (await verify(await launch())).claims);
    const b = await provisionFromLaunch(db, (await verify(await launch({ [CLAIM.roles]: [ROLE.ta] }))).claims);
    expect(b).toEqual({ membershipId: a.membershipId, role: "advisor" });
    const [m] = await db.select().from(memberships).where(eq(memberships.id, a.membershipId));
    expect(m.role).toBe("advisor");
  });

  it("never stores email even if Canvas sends it", async () => {
    await provisionFromLaunch(db, (await verify(await launch({ email: "student@famu.edu" }))).claims);
    const [u] = await db.select().from(users);
    expect(u.email).toBeNull();
  });

  it("rejects a replayed launch (state is single use)", async () => {
    const msg = await launch();
    await verify(msg);
    await expectLaunchError(verify(msg), "invalid_state");
  });

  it("rejects a state cookie that doesn't match", async () => {
    await expectLaunchError(verify({ ...(await launch()), stateCookie: "other" }), "invalid_state");
  });

  it("rejects a token signed by someone else", async () => {
    await expectLaunchError(verify(await launch({ key: attackerKey })), "invalid_token");
  });

  it("rejects the wrong audience, issuer, nonce or an expired token", async () => {
    await expectLaunchError(verify(await launch({ aud: "another-client" })), "invalid_token");
    await expectLaunchError(verify(await launch({ iss: "https://evil.example" })), "invalid_token");
    await expectLaunchError(verify(await launch({ nonce: "forged" })), "invalid_token");
    await expectLaunchError(verify(await launch({ expiresIn: "-10m" })), "invalid_token");
  });

  it("requires azp when there are multiple audiences", async () => {
    await expectLaunchError(verify(await launch({ aud: [CLIENT_ID, "other"] })), "invalid_token");
    await expect(verify(await launch({ aud: [CLIENT_ID, "other"], azp: CLIENT_ID }))).resolves.toBeTruthy();
  });

  it("rejects unregistered deployments and unsupported messages", async () => {
    await expectLaunchError(verify(await launch({ [CLAIM.deploymentId]: "99:zzz" })), "unknown_deployment");
    await expectLaunchError(verify(await launch({ [CLAIM.messageType]: "LtiDeepLinkingRequest" })), "unsupported_message");
    await expectLaunchError(verify(await launch({ [CLAIM.version]: "1.1" })), "unsupported_message");
  });

  it("rejects observers and launches without a course", async () => {
    const observer = (await verify(await launch({ [CLAIM.roles]: [ROLE.mentor] }))).claims;
    await expectLaunchError(provisionFromLaunch(db, observer), "role_not_allowed");
    const noCourse = (await verify(await launch({ [CLAIM.context]: undefined }))).claims;
    await expectLaunchError(provisionFromLaunch(db, noCourse), "missing_context");
  });

  it("ignores an unsubstituted Canvas term variable", async () => {
    const claims = (await verify(await launch({ [CLAIM.custom]: { canvas_term_name: "$Canvas.term.name" } }))).claims;
    await provisionFromLaunch(db, claims);
    const [course] = await db.query.courses.findMany();
    expect(course.term).toBe("");
  });
});

describe("launch tickets", () => {
  it("are single use and stored hashed", async () => {
    const { membershipId } = await provisionFromLaunch(db, (await verify(await launch())).claims);
    const ticket = await issueLaunchTicket(db, membershipId);
    const [row] = await db.select().from(launchTickets);
    expect(row.tokenHash).not.toContain(ticket);
    expect(await redeemLaunchTicket(db, ticket)).toBe(membershipId);
    expect(await redeemLaunchTicket(db, ticket)).toBeNull();
    expect(await redeemLaunchTicket(db, "")).toBeNull();
  });

  it("expire", async () => {
    const { membershipId } = await provisionFromLaunch(db, (await verify(await launch())).claims);
    const ticket = await issueLaunchTicket(db, membershipId);
    await db.update(launchTickets).set({ expiresAt: new Date(Date.now() - 1000) });
    expect(await redeemLaunchTicket(db, ticket)).toBeNull();
  });
});
