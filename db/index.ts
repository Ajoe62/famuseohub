import { mkdirSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";
import * as schema from "./schema";

// Both drivers expose the same query API; we type everything against node-postgres.
export type DB = NodePgDatabase<typeof schema>;

/**
 * DATABASE_URL set   → real Postgres (Neon or another host). On Neon this is the pooled
 *                      (-pooler) URL; migrations use DATABASE_URL_UNPOOLED (see adminDatabaseUrl).
 * DATABASE_URL unset → embedded PGlite stored in PGLITE_DIR (default .data/pglite),
 *                      so local development needs no database server.
 *                      PGlite is single-process: stop `npm run dev` before running db scripts.
 * dataDir "memory://" → throwaway in-memory database (tests).
 */
export function createDb(options: { url?: string; dataDir?: string } = {}): DB {
  const url = options.url ?? process.env.DATABASE_URL;
  if (url) {
    const pool = new Pool({ connectionString: url });
    // On Vercel Fluid compute, closes idle connections before the instance suspends. No-op elsewhere.
    attachDatabasePool(pool);
    return drizzlePg(pool, { schema });
  }
  const dataDir = options.dataDir ?? process.env.PGLITE_DIR ?? ".data/pglite";
  // Dev-only path; the ignore hint stops Turbopack from tracing the whole project into the build.
  if (!dataDir.includes("://")) mkdirSync(path.dirname(path.resolve(/*turbopackIgnore: true*/ dataDir)), { recursive: true });
  const client = new PGlite(dataDir);
  return drizzlePglite(client, { schema }) as unknown as DB;
}

/**
 * URL for schema migrations and other admin work. Neon's pooled connection goes through PgBouncer
 * in transaction mode, which can break migrations, so prefer the direct one when it's provided.
 */
export function adminDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string | undefined {
  return env.DATABASE_URL_UNPOOLED || env.DATABASE_URL || undefined;
}

/** Loads .env.local for CLI scripts (Next.js does this itself). Values already set in the environment win. */
export function loadLocalEnv() {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // No .env.local: fine, e.g. in production where the host provides the environment.
  }
}

const globalForDb =globalThis as unknown as { __famuDb?: DB };

function getDb(): DB {
  // Cache on globalThis so dev hot-reloads reuse one connection / PGlite instance.
  return (globalForDb.__famuDb ??= createDb());
}

/** Lazily-connected shared database. Nothing connects until first use (keeps `next build` offline). */
export const db: DB = new Proxy({} as DB, {
  get(_target, prop) {
    const real = getDb();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export { schema };
