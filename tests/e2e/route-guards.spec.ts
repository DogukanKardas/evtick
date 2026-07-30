import { test, expect } from "@playwright/test";

const skipAuthE2E = process.env.RUN_INTEGRATION_TESTS !== "1";

test.describe("route guards", () => {
  test("unauthenticated user is redirected from dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/, { timeout: 10_000 });
  });

  test("employee cannot access system panel", async ({ page }) => {
    test.skip(skipAuthE2E, "Set RUN_INTEGRATION_TESTS=1 after test:seed");

    await page.goto("/login");
    await page.getByLabel("Şirket Kodu").fill("TESTA");
    await page.getByLabel("E-posta").fill(
      process.env.TEST_EMPLOYEE_A_EMAIL ?? "test-employee-a@evtick.test"
    );
    await page.getByLabel("Şifre").fill(
      process.env.TEST_PASSWORD ?? "TestPass123!"
    );
    await page.getByRole("button", { name: /giriş/i }).click();
    await page.waitForURL(/\/dashboard/);

    await page.goto("/system/tickets");
    await page.waitForURL(/\/(dashboard|login)/, { timeout: 10_000 });
    expect(page.url()).not.toMatch(/\/system\/tickets$/);
  });
});
