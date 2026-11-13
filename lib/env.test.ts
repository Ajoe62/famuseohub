import { describe, expect, it } from "vitest";
import { productionConfigProblems, productionConfigWarnings } from "./env";

const good = {
  DATABASE_URL: "postgres://u:p@db/famu",
  SESSION_SECRET: "x".repeat(32),
  LTI_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----...",
  APP_URL: "https://capstone.example.edu",
};

describe("productionConfigProblems", () => {
  it("accepts a complete configuration", () => {
    expect(productionConfigProblems(good)).toEqual([]);
  });

  it("reports each missing or weak setting", () => {
    expect(productionConfigProblems({})).toHaveLength(4);
    expect(productionConfigProblems({ ...good, SESSION_SECRET: "short" })).toEqual(["SESSION_SECRET must be at least 32 characters."]);
  });

  it("requires https except on localhost", () => {
    expect(productionConfigProblems({ ...good, APP_URL: "http://capstone.example.edu" })).toEqual(["APP_URL must use https:// (Canvas requires it)."]);
    expect(productionConfigProblems({ ...good, APP_URL: "http://localhost:3100" })).toEqual([]);
    expect(productionConfigProblems({ ...good, APP_URL: "not a url" })).toEqual(["APP_URL is not a valid URL."]);
  });

  it("allows PGlite only when explicitly configured", () => {
    expect(productionConfigProblems({ ...good, DATABASE_URL: undefined, PGLITE_DIR: ".data/e2e" })).toEqual([]);
  });

  it("warns when dev login is enabled", () => {
    expect(productionConfigWarnings({ ENABLE_DEV_LOGIN: "true" })).toHaveLength(1);
    expect(productionConfigWarnings(good)).toEqual([]);
  });
});
