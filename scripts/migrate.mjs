// Production migration runner: plain Node, runtime dependencies only (no tsx/drizzle-kit).
// Usage: DATABASE_URL=postgres://... node scripts/migrate.mjs  (also reads .env.local if present)
// Uses DATABASE_URL_UNPOOLED when set: Neon's pooled (PgBouncer) connection can break migrations.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

try {
  process.loadEnvFile(".env.local"); // values already in the environment win
} catch {
  // no .env.local (normal in production)
}

// Vercel preview builds (pull requests, non-production branches) must not change the shared
// database: an unmerged schema change would hit staging before review. Opt in only when previews
// have their own database, e.g. a Neon branch per preview via the Neon–Vercel integration.
if (process.env.VERCEL_ENV === "preview" && process.env.ALLOW_PREVIEW_MIGRATIONS !== "true") {
  console.log("↷ skipping migrations on a preview build (set ALLOW_PREVIEW_MIGRATIONS=true if previews have their own database)");
  process.exit(0);
}

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL (or DATABASE_URL_UNPOOLED) is required.");
  process.exit(1);
}

const migrationsFolder = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "drizzle");
const pool = new pg.Pool({ connectionString: url, max: 1 });
try {
  await migrate(drizzle(pool), { migrationsFolder });
  console.log("✓ migrations applied");
} catch (err) {
  console.error("Migration failed:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await pool.end();
}
