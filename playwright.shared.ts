import type { PlaywrightTestConfig } from "@playwright/test";
import "./tests/support/config";

export function sharedConfig(suite: "native" | "bdd"): PlaywrightTestConfig {
  const ci = Boolean(process.env.CI);
  const evidence = process.env.PW_CAPTURE_EVIDENCE === "true";

  return {
    fullyParallel: false,
    workers: 1,
    retries: 0,
    forbidOnly: ci,
    failOnFlakyTests: ci,
    timeout: 60_000,
    globalTimeout: process.env.RUN_WORKFLOW_TEST === "true" ? 30 * 60_000 : 10 * 60_000,
    expect: { timeout: 15_000 },
    outputDir: `test-results/${suite}`,
    reporter: [
      ["list"],
      ["html", { outputFolder: `artifacts/${suite}/html`, open: "never" }],
      ["junit", { outputFile: `artifacts/${suite}/junit.xml` }]
    ],
    use: {
         headless: Boolean(process.env.CI),
      launchOptions: { slowMo: process.env.PW_SLOW_MO === "true" ? 1_000 : 0 },
      viewport: { width: 1440, height: 900 },
      locale: "en-GB",
      ignoreHTTPSErrors: false,
      screenshot: evidence ? "only-on-failure" : "off",
      trace: evidence ? "retain-on-failure" : "off",
      video: "off",
      actionTimeout: 15_000,
      navigationTimeout: 60_000
    }
  };
}
