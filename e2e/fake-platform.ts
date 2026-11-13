// A minimal LTI 1.3 platform ("fake Canvas") for end-to-end tests. Runs on a different
// site (127.0.0.1) than the app (localhost) so the iframe is genuinely cross-site.
import { createServer, type Server } from "node:http";
import { exportJWK, generateKeyPair, SignJWT, type CryptoKey, type JWK } from "jose";

export const PLATFORM = {
  port: 3101,
  issuer: "https://platform.e2e",
  clientId: "e2e-client",
  deploymentId: "e2e-deployment",
  get origin() {
    return `http://127.0.0.1:${this.port}`;
  },
};

const MEMBERSHIP = "http://purl.imsglobal.org/vocab/lis/v2/membership";
export const USERS: Record<string, { name: string; roles: string[] }> = {
  "student-1": { name: "Morgan Ellis", roles: [`${MEMBERSHIP}#Learner`] },
  "instructor-1": { name: "Dr. Jamie Ortiz", roles: [`${MEMBERSHIP}#Instructor`] },
  "observer-1": { name: "Parent Observer", roles: [`${MEMBERSHIP}#Mentor`] },
};

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export async function startFakePlatform(appOrigin: string) {
  const { privateKey, publicKey } = await generateKeyPair("RS256");
  const jwk: JWK = { ...(await exportJWK(publicKey)), kid: "e2e-key", alg: "RS256", use: "sig" };

  const loginUrl = (user: string) => {
    const q = new URLSearchParams({
      iss: PLATFORM.issuer,
      login_hint: user,
      client_id: PLATFORM.clientId,
      lti_deployment_id: PLATFORM.deploymentId,
      target_link_uri: `${appOrigin}/api/lti/launch`,
    });
    return `${appOrigin}/api/lti/login?${q}`;
  };

  const server: Server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", PLATFORM.origin);
    if (url.pathname === "/jwks") {
      res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ keys: [jwk] }));
      return;
    }
    if (url.pathname === "/course") {
      // A "Canvas course page" that embeds the tool in an iframe.
      const user = url.searchParams.get("user") ?? "student-1";
      res.writeHead(200, { "Content-Type": "text/html" }).end(
        `<!doctype html><title>Fake Canvas</title><h1>Fake Canvas course</h1>` +
          `<iframe id="tool" title="Capstone Hub" src="${escapeHtml(loginUrl(user))}" style="width:100%;height:800px"></iframe>`,
      );
      return;
    }
    if (url.pathname === "/auth") {
      const q = url.searchParams;
      const user = USERS[q.get("login_hint") ?? ""];
      if (!user || q.get("client_id") !== PLATFORM.clientId || !q.get("redirect_uri")?.startsWith(appOrigin)) {
        res.writeHead(400).end("bad auth request");
        return;
      }
      const idToken = await signLaunch(privateKey, q.get("login_hint")!, user, q.get("nonce")!);
      // Like Canvas: auto-submit a form_post of id_token + state to the tool's redirect_uri.
      res.writeHead(200, { "Content-Type": "text/html" }).end(
        `<!doctype html><form id="f" method="post" action="${escapeHtml(q.get("redirect_uri")!)}">` +
          `<input type="hidden" name="id_token" value="${escapeHtml(idToken)}">` +
          `<input type="hidden" name="state" value="${escapeHtml(q.get("state")!)}"></form>` +
          `<script>document.getElementById("f").submit()</script>`,
      );
      return;
    }
    res.writeHead(404).end();
  });

  await new Promise<void>((resolve) => server.listen(PLATFORM.port, "127.0.0.1", resolve));
  return { loginUrl, close: () => new Promise<void>((resolve) => server.close(() => resolve())) };
}

async function signLaunch(key: CryptoKey, sub: string, user: { name: string; roles: string[] }, nonce: string) {
  return new SignJWT({
    nonce,
    name: user.name,
    "https://purl.imsglobal.org/spec/lti/claim/message_type": "LtiResourceLinkRequest",
    "https://purl.imsglobal.org/spec/lti/claim/version": "1.3.0",
    "https://purl.imsglobal.org/spec/lti/claim/deployment_id": PLATFORM.deploymentId,
    "https://purl.imsglobal.org/spec/lti/claim/roles": user.roles,
    "https://purl.imsglobal.org/spec/lti/claim/context": { id: "e2e-course", title: "EVR 4910 Capstone (E2E)" },
    "https://purl.imsglobal.org/spec/lti/claim/resource_link": { id: "e2e-link" },
    "https://purl.imsglobal.org/spec/lti/claim/custom": { canvas_term_name: "Spring 2027" },
  })
    .setProtectedHeader({ alg: "RS256", kid: "e2e-key" })
    .setIssuer(PLATFORM.issuer)
    .setAudience(PLATFORM.clientId)
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(key);
}
