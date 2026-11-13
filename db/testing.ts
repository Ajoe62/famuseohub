import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import type { DB } from "./index";
import * as schema from "./schema";

let template: Promise<PGlite> | null = null;

/**
 * A fresh, fully migrated in-memory Postgres for one test. Migrations run once per test
 * file into a template database; each call returns a cheap clone of it.
 */
export async function createTestDb(): Promise<DB> {
  template ??= (async () => {
    const pg = new PGlite();
    await migrate(drizzle(pg, { schema }), { migrationsFolder: path.join(process.cwd(), "drizzle") });
    return pg;
  })();
  const clone = (await (await template).clone()) as PGlite;
  return drizzle(clone, { schema }) as unknown as DB;
}
