import { chromium, devices } from "@playwright/test";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { readLoginCredentials, readTargetConfig } from "../tests/support/config";
import { expectAuthenticatedWorkspace, openWorkspace } from "../tests/support/myworkspace";
import { loginWithCredentials } from "../tests/support/login";

async function capture(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.some((argument) => argument !== "--credentials")) {
    throw new Error("Unsupported capture argument. Use npm run auth:capture or npm run auth:login.");
  }
  const target = readTargetConfig();
  const credentials = args.includes("--credentials") ? readLoginCredentials() : undefined;
  if (new URL(target.baseUrl).protocol === "http:") {
    console.warn("HTTP does not encrypt credentials or session tokens. Use only an approved isolated environment; prefer HTTPS.");
  }
  const browser = await chromium.launch({ headless: Boolean(credentials) });
  const temporaryPath = `${target.authStatePath}.${process.pid}.tmp`;
  try {
    const context = await browser.newContext({ ...devices["Desktop Chrome"], locale: "en-GB", ignoreHTTPSErrors: false });
    const page = await context.newPage();
    await page.goto(target.baseUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
    if (credentials) {
      await loginWithCredentials(page, target.baseUrl, credentials);
    } else {
      console.log("Sign in manually in the opened browser within five minutes. No credentials are read by this command.");
      await expectAuthenticatedWorkspace(page, 5 * 60_000);
    }
    const state = await context.storageState({ indexedDB: true });
    const validationContext = await browser.newContext({ ...devices["Desktop Chrome"], storageState: state, locale: "en-GB", ignoreHTTPSErrors: false });
    try {
      await openWorkspace(await validationContext.newPage(), target.baseUrl);
    } finally {
      await validationContext.close();
    }
    await mkdir(dirname(target.authStatePath), { recursive: true, mode: 0o700 });
    await writeFile(temporaryPath, JSON.stringify(state), { mode: 0o600, flag: "wx" });
    await rename(temporaryPath, target.authStatePath);
    console.log("Authentication state verified in a fresh context and saved privately. Run npm run setup:check, then npm run test:smoke.");
  } finally {
    await rm(temporaryPath, { force: true });
    await browser.close();
  }
}

capture().catch((error: unknown) => {
  let message = error instanceof Error ? error.message : "Authentication capture failed with a non-Error value.";
  if (process.argv.includes("--credentials")) {
    for (const value of [process.env.LOGIN_USER, process.env.LOGIN_PASSWORD]) {
      if (value) message = message.split(value).join("[redacted]");
    }
  }
  console.error(message);
  process.exitCode = 1;
});
