// Production migration runner: plain Node, runtime dependencies only (no tsx/drizzle-kit).
// Usage: DATABASE_URL=postgres://... node scripts/migrate.mjs
import path from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required.");
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
