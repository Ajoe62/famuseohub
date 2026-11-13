import { createHash, createPrivateKey, createPublicKey, generateKeyPairSync, type KeyObject } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { exportJWK, type JWK } from "jose";

/**
 * The tool's RSA signing key. Canvas fetches the public half from /api/lti/jwks. It's
 * used to sign service requests (grade passback / roster), not the launch itself.
 *
 * Production: LTI_PRIVATE_KEY (PKCS#8 PEM; "\n" escapes allowed) and optional LTI_KEY_ID.
 * Development: generated once and stored in .data/lti-tool-key.pem (gitignored).
 */
type ToolKey = { kid: string; privateKey: KeyObject; publicKey: KeyObject };

let cached: ToolKey | null = null;

export function generateToolKeyPem(): string {
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  return privateKey.export({ type: "pkcs8", format: "pem" }).toString();
}

function fromPem(pem: string, kid?: string): ToolKey {
  const privateKey = createPrivateKey(pem);
  const publicKey = createPublicKey(privateKey);
  const der = publicKey.export({ type: "spki", format: "der" });
  return { kid: kid || createHash("sha256").update(der).digest("base64url").slice(0, 16), privateKey, publicKey };
}

export function getToolKey(): ToolKey {
  if (cached) return cached;
  const envPem = process.env.LTI_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (envPem) {
    cached = fromPem(envPem, process.env.LTI_KEY_ID);
  } else if (process.env.NODE_ENV === "production") {
    throw new Error("LTI_PRIVATE_KEY must be set in production. Generate one with `npm run lti:keys`.");
  } else {
    const file = path.join(/*turbopackIgnore: true*/ process.cwd(), ".data", "lti-tool-key.pem");
    if (!existsSync(file)) {
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, generateToolKeyPem(), { mode: 0o600 });
    }
    cached = fromPem(readFileSync(file, "utf8"));
  }
  return cached;
}

export async function publicJwks(): Promise<{ keys: JWK[] }> {
  const { kid, publicKey } = getToolKey();
  const jwk = await exportJWK(publicKey);
  return { keys: [{ ...jwk, kid, alg: "RS256", use: "sig" }] };
}
