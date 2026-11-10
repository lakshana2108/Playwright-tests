import dotenv from "dotenv";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

dotenv.config({ quiet: true });
dotenv.config({ path: ".env.workflow", override: true, quiet: true });

const requireFromProject = createRequire(`${process.cwd()}/package.json`);
const result = spawnSync(process.execPath, [
  requireFromProject.resolve("@playwright/test/cli"),
  "test",
  "-c", "playwright.bdd.config.ts",
  "--grep", "@JobContext",
  "--headed",
  ...process.argv.slice(2)
], {
  stdio: "inherit",
  env: {
    ...process.env,
    RUN_JOB_CONTEXT_TEST: "true",
    PW_SLOW_MO: "true"
  }
});

if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? 1;