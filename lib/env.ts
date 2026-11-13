type Env = Record<string, string | undefined>;

/**
 * Production configuration problems. Checked once at server start (instrumentation.ts)
 * so a misconfigured deployment fails immediately instead of on the first launch.
 */
export function productionConfigProblems(env: Env = process.env): string[] {
  const problems: string[] = [];
  if (!env.DATABASE_URL && !env.PGLITE_DIR) {
    problems.push("DATABASE_URL is not set (set PGLITE_DIR explicitly only for throwaway test servers).");
  }
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) problems.push("SESSION_SECRET must be at least 32 characters.");
  if (!env.LTI_PRIVATE_KEY) problems.push("LTI_PRIVATE_KEY is not set (generate with `npm run lti:keys`).");
  if (!env.APP_URL) {
    problems.push("APP_URL is not set (the public https URL Canvas uses to reach the app).");
  } else {
    try {
      const url = new URL(env.APP_URL);
      const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
      if (url.protocol !== "https:" && !local) problems.push("APP_URL must use https:// (Canvas requires it).");
    } catch {
      problems.push("APP_URL is not a valid URL.");
    }
  }
  return problems;
}

export function productionConfigWarnings(env: Env = process.env): string[] {
  const warnings: string[] = [];
  if (env.ENABLE_DEV_LOGIN === "true") {
    warnings.push("ENABLE_DEV_LOGIN=true: anyone can sign in as any user. Use only for demos with fictional data.");
  }
  if (env.VERCEL && !env.CRON_SECRET) {
    warnings.push("CRON_SECRET is not set: the daily cleanup job (/api/cron/cleanup) is disabled.");
  }
  return warnings;
}
