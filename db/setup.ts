/**
 * CLI: npm run db:migrate | db:seed | db:setup (reset + migrate + seed)
 * With PGlite, stop `npm run dev` first. PGlite allows only one process at a time.
 */
import { rm } from "node:fs/promises";
import { sql } from "drizzle-orm";
import { createDb } from "./index";
import { runMigrations } from "./migrate";
import { seed } from "./seed";

async function main() {
  const command = process.argv[2];
  const usingPostgres = Boolean(process.env.DATABASE_URL);

  if (command === "setup") {
    if (process.env.NODE_ENV === "production") throw new Error("Refusing to reset a production database.");
    if (usingPostgres) {
      const db = createDb();
      await db.execute(sql`DROP SCHEMA IF EXISTS public CASCADE; DROP SCHEMA IF EXISTS drizzle CASCADE; CREATE SCHEMA public;`);
    } else {
      await rm(process.env.PGLITE_DIR ?? ".data/pglite", { recursive: true, force: true });
    }
  }

  const db = createDb();
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
  console.error(err);
  process.exit(1);
});
