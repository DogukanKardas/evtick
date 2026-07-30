import { defineConfig, devices } from "@playwright/test";
import path from "path";
import { config } from "dotenv";

config({ path: path.resolve(process.cwd(), ".env.test.local") });
config({ path: path.resolve(process.cwd(), ".env.local") });

const baseURL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  testIgnore: "**/staging/**",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: process.env.CI ? "npm run start" : "npm run dev",
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
