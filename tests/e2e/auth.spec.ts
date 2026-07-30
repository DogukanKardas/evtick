import { test, expect } from "@playwright/test";

const skipAuthE2E = process.env.RUN_INTEGRATION_TESTS !== "1";

test.describe("auth", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel("E-posta")).toBeVisible();
    await expect(page.getByLabel("Şifre")).toBeVisible();
  });

  test("super admin redirects to system panel", async ({ page }) => {
    test.skip(skipAuthE2E, "Set RUN_INTEGRATION_TESTS=1 after test:seed");
    await page.goto("/login");
    await page.getByLabel("Şirket Kodu").fill("EVTK");
    await page.getByLabel("E-posta").fill(
      process.env.TEST_SUPER_EMAIL ?? "test-super@evtick.test"
    );
    await page.getByLabel("Şifre").fill(
      process.env.TEST_PASSWORD ?? "TestPass123!"
    );
    await page.getByRole("button", { name: /giriş/i }).click();
    await page.waitForURL(/\/system/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Sistem Paneli" })).toBeVisible();
  });

  test("employee redirects to dashboard", async ({ page }) => {
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
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Panel" })).toBeVisible();
  });
});
