/** Prints a new RSA private key for LTI_PRIVATE_KEY (store it in your host's secret manager). */
import { createHash, createPrivateKey, createPublicKey } from "node:crypto";
import { generateToolKeyPem } from "../lib/lti/keys";

const pem = generateToolKeyPem();
const der = createPublicKey(createPrivateKey(pem)).export({ type: "spki", format: "der" });
const kid = createHash("sha256").update(der).digest("base64url").slice(0, 16);

console.log("# Add these to your production environment (never commit them):\n");
console.log(`LTI_KEY_ID=${kid}`);
console.log(`LTI_PRIVATE_KEY="${pem.trim().replace(/\n/g, "\\n")}"`);
