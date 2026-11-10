import dotenv from "dotenv";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { readLoginCredentials, readTargetConfig } from "../tests/support/config";
import { loginWithCredentials } from "../tests/support/login";

dotenv.config({ quiet: true });
dotenv.config({ path: ".env.workflow", override: true, quiet: true });

async function prepareWorkflowInputs(inputDirectory: string): Promise<void> {
  const filenames = ["launchfile_1.pdf", "launchfile_2.pdf"];
  const missingFiles = filenames.filter(filename => !existsSync(join(inputDirectory, filename)));
  if (missingFiles.length === 0) return;

  const target = readTargetConfig();
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ locale: "en-GB" });
    await page.goto(target.baseUrl, { waitUntil: "domcontentloaded" });
    await loginWithCredentials(page, target.baseUrl, readLoginCredentials());
    await page.getByRole("navigation").getByRole("link", { name: "Jobs", exact: true }).click();
    await page.getByRole("row").getByText(process.env.JOB_CONTEXT_NAME || "Job_lap", { exact: true }).first().click();
    await page.getByRole("link", { name: "Smoke Test for BrowserMyWorkspace", exact: true }).click();
    await page.getByRole("link", { name: "input files", exact: true }).click();

    for (const filename of missingFiles) {
      const fileRow = page.getByRole("row").filter({
        has: page.getByRole("cell", { name: filename, exact: true })
      });
      const downloadHref = await fileRow.locator("a[download]").getAttribute("href");
      if (!downloadHref) throw new Error(`Could not find the app download link for ${filename}.`);
      const response = await page.context().request.get(new URL(downloadHref, page.url()).href);
      if (!response.ok()) throw new Error(`Downloading ${filename} failed with HTTP ${response.status()}.`);
      const contents = await response.body();
      if (contents.subarray(0, 5).toString("ascii") !== "%PDF-") {
        throw new Error(`The app download for ${filename} was not a PDF.`);
      }
      writeFileSync(join(inputDirectory, filename), contents, { flag: "wx" });
      console.log(`Downloaded original ${filename} from My Workspace.`);
    }
  } finally {
    await browser.close();
  }
}

async function run(): Promise<void> {
  const inputDirectory = process.env.WORKFLOW_INPUT_DIR;
  if (!inputDirectory || !existsSync(inputDirectory)) {
    throw new Error("WORKFLOW_INPUT_DIR must point to an existing local directory.");
  }
  await prepareWorkflowInputs(inputDirectory);

  const requireFromProject = createRequire(`${process.cwd()}/package.json`);
  const result = spawnSync(process.execPath, [
    requireFromProject.resolve("@playwright/test/cli"),
    "test",
    "-c", "playwright.config.ts",
    "tests/native/workspace.workflow.spec.ts",
    "--grep", "@Workflow",
    "--headed",
    ...process.argv.slice(2)
  ], {
    stdio: "inherit",
    env: {
      ...process.env,
      RUN_WORKFLOW_TEST: "true",
      PW_SLOW_MO: process.env.PW_SLOW_MO || "true"
    }
  });

  if (result.error) console.error(result.error.message);
  process.exitCode = result.status ?? 1;
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unable to prepare workflow inputs.");
  process.exitCode = 1;
});