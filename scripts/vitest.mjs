// Runs Vitest from the canonical project path. On Windows, a working directory with
// different drive-letter casing ("c:\" vs "C:\") makes Node load vitest twice, and every
// test file then fails with "Vitest failed to find the runner".
import { spawn } from "node:child_process";
import { realpathSync } from "node:fs";
import path from "node:path";

const cwd = realpathSync.native(process.cwd());
const bin = path.join(cwd, "node_modules", "vitest", "vitest.mjs");
const child = spawn(process.execPath, [bin, ...process.argv.slice(2)], { cwd, stdio: "inherit" });
child.on("exit", (code) => process.exit(code ?? 1));
