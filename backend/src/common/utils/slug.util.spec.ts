import { describe, expect, it } from "vitest";
import { slugify, uniqueSlug } from "./slug.util.js";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Nova X2 Wireless Headphones")).toBe(
      "nova-x2-wireless-headphones",
    );
  });

  it("strips diacritics and illegal characters", () => {
    expect(slugify("Café & Crème!")).toBe("cafe-creme");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("--hello world--")).toBe("hello-world");
  });
});

describe("uniqueSlug", () => {
  it("returns the base slug when free", async () => {
    const result = await uniqueSlug("plain tee", async () => false);
    expect(result).toBe("plain-tee");
  });

  it("appends a counter when taken", async () => {
    const taken = new Set(["plain-tee", "plain-tee-2"]);
    const result = await uniqueSlug("plain tee", async (s) => taken.has(s));
    expect(result).toBe("plain-tee-3");
  });
});
