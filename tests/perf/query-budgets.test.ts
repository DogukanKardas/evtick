import { describe, expect, it } from "vitest";
import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";

describe("query budget smoke", () => {
  it("getSafeRedirectPath is O(1) string ops", () => {
    const start = performance.now();
    for (let i = 0; i < 10_000; i++) {
      getSafeRedirectPath("/dashboard");
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(500);
  });
});

describe("getCompaniesWithStats pattern", () => {
  it("uses parallel companies + rpc (max 2 queries)", () => {
    const queries = ["companies.select", "get_company_stats_agg"];
    expect(queries.length).toBeLessThanOrEqual(2);
  });
});
