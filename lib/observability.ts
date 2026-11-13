/**
 * Server error reporting (Next.js `onRequestError`, wired in instrumentation.ts).
 *
 * Every server error becomes one JSON log line (searchable in Vercel → Logs). If ERROR_WEBHOOK_URL
 * is set (a Slack or Discord incoming webhook), a short alert is posted there too.
 *
 * Never reported: headers (they carry the session cookie), query strings (they can carry a
 * single-use launch ticket), request bodies, or user identities.
 */
export type ErrorRequest = { path: string; method: string };
export type ErrorContext = { routePath?: string; routeType?: string };

export function describeError(err: unknown, request: ErrorRequest, context: ErrorContext) {
  const digest = typeof err === "object" && err !== null && "digest" in err ? String(err.digest) : undefined;
  return {
    level: "error",
    message: err instanceof Error ? err.message : String(err),
    name: err instanceof Error ? err.name : undefined,
    digest,
    method: request.method,
    path: request.path.split("?")[0],
    route: context.routePath,
    routeType: context.routeType,
    env: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    deployment: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7),
  };
}

export async function reportRequestError(err: unknown, request: ErrorRequest, context: ErrorContext) {
  const report = describeError(err, request, context);
  console.error(JSON.stringify(report));

  const webhook = process.env.ERROR_WEBHOOK_URL;
  if (!webhook) return;
  const text = `Capstone Hub error (${report.env}${report.deployment ? ` @ ${report.deployment}` : ""}): ${report.method} ${report.path}\n${report.name ?? "Error"}: ${report.message.slice(0, 500)}`;
  try {
    // `text` is read by Slack, `content` by Discord.
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, content: text }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // Alerting is best-effort; the log line above is the record.
  }
}
