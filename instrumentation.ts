// Runs once when a Next.js server instance starts.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NODE_ENV !== "production") return;
  // `next build` also loads this; only validate a running server.
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const { productionConfigProblems, productionConfigWarnings } = await import("./lib/env");
  for (const w of productionConfigWarnings()) console.warn(`[config] WARNING: ${w}`);
  const problems = productionConfigProblems();
  if (problems.length) {
    throw new Error(`Refusing to start, invalid production configuration:\n - ${problems.join("\n - ")}`);
  }
}
