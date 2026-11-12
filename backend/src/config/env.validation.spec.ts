import { describe, expect, it } from "vitest";
import { validateEnv } from "./env.validation.js";

const base = {
  DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:5432/ecommerce",
  JWT_ACCESS_SECRET: "a".repeat(32),
  JWT_REFRESH_SECRET: "b".repeat(32),
};

describe("env validation", () => {
  it("accepts a valid environment", () => {
    const env = validateEnv({ ...base });
    expect(env.PORT).toBe(3000);
    expect(env.JWT_ACCESS_TTL).toBe("15m");
    expect(env.CORS_ORIGIN).toBe("http://localhost:5173");
  });

  it("ignores unrelated process env keys like npm's _", () => {
    expect(() => validateEnv({ ...base, _: "/usr/bin/node" })).not.toThrow();
  });

  it("rejects short JWT secrets", () => {
    expect(() =>
      validateEnv({ ...base, JWT_ACCESS_SECRET: "short" }),
    ).toThrow(/JWT_ACCESS_SECRET/);
  });

  it("rejects a missing database url", () => {
    const { DATABASE_URL: _drop, ...rest } = base;
    void _drop;
    expect(() => validateEnv(rest)).toThrow(/DATABASE_URL/);
  });

  it("converts numeric strings", () => {
    const env = validateEnv({ ...base, PORT: "4000" as unknown as number });
    expect(env.PORT).toBe(4000);
  });
});
