import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";

const root = resolve(__dirname, "..");

test("VS Code workspace is portable and all npm tasks reference real commands", () => {
  const workspace = JSON.parse(readFileSync(join(root, "AE-MyWorkspace.code-workspace"), "utf8"));
  assert.deepEqual(workspace.folders.map((folder: { path: string }) => folder.path), ["."]);
  assert.equal(workspace.settings["workbench.startupEditor"], "readme");
  const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const tasks = JSON.parse(readFileSync(join(root, ".vscode/tasks.json"), "utf8"));
  for (const task of tasks.tasks) {
    if (task.type === "npm") {
      assert.equal(typeof packageJson.scripts[task.script], "string", `Unknown task script: ${task.script}`);
    } else {
      assert.equal(task.type, "process");
      assert.equal(task.command, "npm");
      assert.deepEqual(task.args, ["ci"]);
      assert.equal(task.options.cwd, "${workspaceFolder}");
    }
  }
  const settings = JSON.parse(readFileSync(join(root, ".vscode/settings.json"), "utf8"));
  assert.deepEqual(settings["cucumber.features"], ["features/current/**/*.feature"]);
  assert.deepEqual(settings["cucumber.glue"], ["tests/steps/**/*.ts"]);
  const extensions = JSON.parse(readFileSync(join(root, ".vscode/extensions.json"), "utf8"));
  assert.equal(extensions.recommendations.length, 3);
});

test("relative documentation links point to existing deliverables", () => {
  const documents = [
    join(root, "README.md"),
    ...readdirSync(join(root, "docs")).filter((name) => name.endsWith(".md")).map((name) => join(root, "docs", name)),
    join(root, "examples/imaging-engine/REGRESSION_DESIGN.md")
  ];
  for (const document of documents) {
    const content = readFileSync(document, "utf8");
    for (const match of content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      const target = match[1];
      if (/^https?:/.test(target) || target.startsWith("#")) continue;
      assert.equal(existsSync(resolve(dirname(document), target.split("#")[0])), true, `Broken link in ${document}: ${target}`);
    }
  }
});

test("private data and generated evidence are excluded from Git", () => {
  const ignores = readFileSync(join(root, ".gitignore"), "utf8").split(/\r?\n/);
  for (const entry of [".env", ".env.*", ".auth/", ".features-gen/", "artifacts/", "test-results/", "downloads/", "node_modules/"]) {
    assert.ok(ignores.includes(entry), `Missing private/generated ignore: ${entry}`);
  }
  assert.ok(ignores.includes("!.env.example"));
});

test("live workflow preflight requires a state path outside the checkout", () => {
  const workflow = readFileSync(join(root, ".github/workflows/myworkspace-live.yml"), "utf8");
  const source = workflow.match(/^\s+node -e "([^"\n]+)"$/m)?.[1];
  assert.ok(source, "Expected the live workflow Node preflight");
  for (const [baseUrl, statePath, expected] of [
    ["", "", 1],
    ["http://localhost/myworkspace/", ".auth/test.json", 1],
    ["http://localhost/myworkspace/", join(root, ".auth/test.json"), 1],
    ["http://localhost/myworkspace/", join(tmpdir(), "runner-private-state.json"), 0]
  ] as const) {
    const result: SpawnSyncReturns<string> = spawnSync(process.execPath, ["-e", source], {
      cwd: root,
      env: { ...process.env, BASE_URL: baseUrl, AUTH_STATE_PATH: statePath },
      encoding: "utf8"
    });
    assert.equal(result.status, expected, result.stderr);
  }
});
