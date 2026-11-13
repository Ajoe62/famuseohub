/**
 * Register an LTI platform (Canvas instance) and the deployment IDs to accept.
 *
 *   npm run lti:register -- --preset canvas-beta --client-id 10000000000123 --deployment-id 123:abc
 *   npm run lti:register -- --name saLTIre --issuer https://... --client-id ... \
 *       --auth-url https://... --token-url https://... --jwks-url https://... --deployment-id ...
 *
 * Re-running is safe: the platform is updated and new deployment IDs are added.
 * With PGlite, stop `npm run dev` first.
 */
import { and, eq } from "drizzle-orm";
import { createDb } from "./index";
import { ltiDeployments, ltiPlatforms } from "./schema";

// Instructure-hosted Canvas. The issuer is shared by every institution on that environment;
// the client_id (the Developer Key ID) identifies FAMU's key.
const PRESETS: Record<string, { name: string; issuer: string; sso: string }> = {
  canvas: { name: "Canvas (production)", issuer: "https://canvas.instructure.com", sso: "https://sso.canvaslms.com" },
  "canvas-beta": { name: "Canvas (beta)", issuer: "https://canvas.beta.instructure.com", sso: "https://sso.beta.canvaslms.com" },
  "canvas-test": { name: "Canvas (test)", issuer: "https://canvas.test.instructure.com", sso: "https://sso.test.canvaslms.com" },
};

function parseArgs(argv: string[]) {
  const out: Record<string, string[]> = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (!key.startsWith("--")) throw new Error(`Unexpected argument: ${key}`);
    const value = argv[i + 1];
    if (value === undefined || value.startsWith("--")) throw new Error(`Missing value for ${key}`);
    (out[key.slice(2)] ??= []).push(value);
    i++;
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const one = (k: string) => args[k]?.[0];
  const preset = one("preset") ? PRESETS[one("preset")!] : undefined;
  if (one("preset") && !preset) throw new Error(`Unknown preset. Use one of: ${Object.keys(PRESETS).join(", ")}`);

  const platform = {
    name: one("name") ?? preset?.name,
    issuer: one("issuer") ?? preset?.issuer,
    clientId: one("client-id"),
    authUrl: one("auth-url") ?? (preset && `${preset.sso}/api/lti/authorize_redirect`),
    tokenUrl: one("token-url") ?? (preset && `${preset.sso}/login/oauth2/token`),
    jwksUrl: one("jwks-url") ?? (preset && `${preset.sso}/api/lti/security/jwks`),
  };
  const missing = Object.entries(platform).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) throw new Error(`Missing: ${missing.join(", ")} (see usage at the top of db/lti-register.ts)`);
  const deploymentIds = args["deployment-id"] ?? [];
  if (deploymentIds.length === 0) throw new Error("Pass at least one --deployment-id (shown in Canvas after installing the tool).");

  const db = createDb();
  const values = platform as Required<{ [K in keyof typeof platform]: string }>;
  const [row] = await db
    .insert(ltiPlatforms)
    .values(values)
    .onConflictDoUpdate({ target: [ltiPlatforms.issuer, ltiPlatforms.clientId], set: values })
    .returning();
  for (const deploymentId of deploymentIds) {
    await db.insert(ltiDeployments).values({ platformId: row.id, deploymentId }).onConflictDoNothing();
  }
  const deployments = await db.select().from(ltiDeployments).where(and(eq(ltiDeployments.platformId, row.id)));
  console.log(`✓ ${row.name}  issuer=${row.issuer}  client_id=${row.clientId}`);
  console.log(`  deployments: ${deployments.map((d) => d.deploymentId).join(", ")}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
