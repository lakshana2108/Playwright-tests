import dotenv from "dotenv";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

dotenv.config({ quiet: true });
dotenv.config({ path: ".env.workflow", override: true, quiet: true });

const npmCli = process.env.npm_execpath;
if (!npmCli) {
  throw new Error("Run this script through npm: npm run test:bdd:activity.");
}

const env = { ...process.env, PW_SLOW_MO: "true" };
const generation = spawnSync(process.execPath, [npmCli, "run", "bdd:gen"], {
  stdio: "inherit",
  env
});
if (generation.error) console.error(generation.error.message);

if (generation.status !== 0) {
  process.exitCode = generation.status ?? 1;
} else {
  const requireFromProject = createRequire(`${process.cwd()}/package.json`);
  const result = spawnSync(process.execPath, [
    requireFromProject.resolve("@playwright/test/cli"),
    "test",
    "-c", "playwright.bdd.config.ts",
    "features/current/workspace/activity.feature",
    "--headed"
  ], {
    stdio: "inherit",
    env
  });

  if (result.error) console.error(result.error.message);
  process.exitCode = result.status ?? 1;
}