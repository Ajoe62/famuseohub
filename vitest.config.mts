import { realpathSync } from "node:fs";
import { defineConfig } from "vitest/config";

// Canonical path (true drive-letter casing on Windows). A "c:\" vs "C:\" mismatch makes
// Node load vitest twice, and tests then fail with "Vitest failed to find the runner".
const root = realpathSync.native(import.meta.dirname);

export default defineConfig({
  root,
  resolve: { alias: { "@": root } },
  test: {
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", "e2e/**", ".next/**"],
    testTimeout: 30_000,
    hookTimeout: 60_000, // first test per file migrates the template database
  },
});
