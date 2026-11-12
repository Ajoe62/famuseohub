import path from "node:path";
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import type { DB } from "./index";

const migrationsFolder = path.join(process.cwd(), "drizzle");

/** Applies SQL migrations from ./drizzle using whichever driver `db` was created with. */
export async function runMigrations(db: DB, usingPostgres = Boolean(process.env.DATABASE_URL)) {
  if (usingPostgres) {
    await migratePg(db, { migrationsFolder });
  } else {
    await migratePglite(db as unknown as PgliteDatabase, { migrationsFolder });
  }
}
