import { defineConfig, devices } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";
import { sharedConfig } from "./playwright.shared";

const testDir = defineBddConfig({
  features: "features/current/**/*.feature",
  steps: ["tests/fixtures.ts", "tests/steps/**/*.steps.ts"],
  outputDir: ".features-gen",
  missingSteps: "fail-on-gen"
});

export default defineConfig({
  ...sharedConfig("bdd"),
  testDir,
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }]
});
