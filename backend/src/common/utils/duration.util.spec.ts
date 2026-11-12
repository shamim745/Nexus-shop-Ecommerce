import { describe, expect, it } from "vitest";
import { parseDuration } from "./duration.util.js";

describe("parseDuration", () => {
  it("parses seconds, minutes, hours and days", () => {
    expect(parseDuration("30s")).toBe(30);
    expect(parseDuration("15m")).toBe(900);
    expect(parseDuration("2h")).toBe(7200);
    expect(parseDuration("7d")).toBe(604800);
  });

  it("falls back to the default for invalid input", () => {
    expect(parseDuration("bogus")).toBe(900);
    expect(parseDuration("", 42)).toBe(42);
    expect(parseDuration("10x", 7)).toBe(7);
  });
});
