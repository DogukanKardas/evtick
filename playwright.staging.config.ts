import baseConfig from "./playwright.config";

export default {
  ...baseConfig,
  testDir: "./tests/e2e/staging",
  webServer: undefined,
  retries: 0,
};
