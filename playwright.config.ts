import { defineConfig, devices } from "@playwright/test";
import { sharedConfig } from "./playwright.shared";

export default defineConfig({
  ...sharedConfig("native"),
  testDir: "./tests/native",
  testMatch: "**/*.spec.ts",
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }]
});
