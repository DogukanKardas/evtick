import { describe, expect, it } from "vitest";
import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";

describe("getSafeRedirectPath", () => {
  it("allows safe relative paths", () => {
    expect(getSafeRedirectPath("/dashboard")).toBe("/dashboard");
    expect(getSafeRedirectPath("/tickets/new?x=1")).toBe("/tickets/new?x=1");
  });

  it("blocks open redirects", () => {
    expect(getSafeRedirectPath("//evil.com")).toBe("/dashboard");
    expect(getSafeRedirectPath("https://evil.com")).toBe("/dashboard");
    expect(getSafeRedirectPath("/\\evil")).toBe("/dashboard");
    expect(getSafeRedirectPath("/path@evil.com")).toBe("/dashboard");
  });

  it("falls back when empty", () => {
    expect(getSafeRedirectPath(null)).toBe("/dashboard");
    expect(getSafeRedirectPath("")).toBe("/dashboard");
  });
});
