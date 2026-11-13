/**
 * CLI: npm run db:migrate | db:seed | db:setup (reset + migrate + seed)
 * Reads .env.local, so with DATABASE_URL set these act on that database (e.g. Neon).
 * With PGlite, stop `npm run dev` first. PGlite allows only one process at a time.
 */
import { rm } from "node:fs/promises";
import { sql } from "drizzle-orm";
import { adminDatabaseUrl, createDb, loadLocalEnv } from "./index";
import { runMigrations } from "./migrate";
import { seed } from "./seed";

async function main() {
  loadLocalEnv();
  const command = process.argv[2];
  const url = adminDatabaseUrl();
  const usingPostgres = Boolean(url);

  if (command === "setup") {
    if (process.env.NODE_ENV === "production") throw new Error("Refusing to reset a production database.");
    if (usingPostgres) {
      // Erasing a hosted database must be deliberate, never a side effect of a leftover .env.local.
      if (!process.argv.includes("--force")) {
        throw new Error(
          `db:setup would ERASE every table on ${new URL(url!).hostname}.\n` +
            "Use `npm run db:migrate` to create or update tables instead, or re-run with `npm run db:setup -- --force`.",
        );
      }
      const db = createDb({ url });
      await db.execute(sql`DROP SCHEMA IF EXISTS public CASCADE; DROP SCHEMA IF EXISTS drizzle CASCADE; CREATE SCHEMA public;`);
    } else {
      await rm(process.env.PGLITE_DIR ?? ".data/pglite", { recursive: true, force: true });
    }
  }

  const db = createDb({ url });
  if (command === "migrate" || command === "setup") {
    await runMigrations(db, usingPostgres);
    console.log("✓ migrations applied");
  }
  if (command === "seed" || command === "setup") {
    await seed(db);
    console.log("✓ sample data seeded");
  }
  if (!["migrate", "seed", "setup"].includes(command ?? "")) {
    throw new Error("Usage: tsx db/setup.ts <migrate|seed|setup>");
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
