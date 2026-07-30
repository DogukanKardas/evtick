import { test, expect } from "@playwright/test";

const skipAuthE2E = process.env.RUN_INTEGRATION_TESTS !== "1";

test.describe("ticket happy path", () => {
  test("employee can open tickets list", async ({ page }) => {
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

    await page.goto("/tickets");
    await expect(page.getByRole("heading", { name: /talepler/i })).toBeVisible({
      timeout: 10_000,
    });
  });
});
