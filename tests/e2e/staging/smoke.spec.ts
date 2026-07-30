import { test, expect } from "@playwright/test";

test("staging login page is reachable", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByLabel("E-posta")).toBeVisible();
});
