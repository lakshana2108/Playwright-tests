import assert from "node:assert/strict";
import { mkdtempSync, rmdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { readLoginCredentials, readTargetConfig, validateAuthState } from "../tests/support/config";

test("missing, malformed and placeholder URLs fail with instructions", () => {
  assert.throws(() => readTargetConfig({}), /BASE_URL is missing/);
  assert.throws(() => readTargetConfig({ BASE_URL: "not a url" }), /complete http/);
  assert.throws(() => readTargetConfig({ BASE_URL: "https://your-ae-host.example/myworkspace/" }), /placeholder/);
  assert.throws(() => readTargetConfig({ BASE_URL: "file:///tmp/workspace" }), /HTTP\(S\)/);
  assert.throws(() => readTargetConfig({ BASE_URL: "https://user:password@localhost/myworkspace/" }), /embedded credentials/);
});

test("target URL is normalized and state path can be overridden", () => {
  const target = readTargetConfig({ BASE_URL: "  https://localhost:9000/myworkspace/  ", AUTH_STATE_PATH: ".auth/qa-test.json" });
  assert.equal(target.baseUrl, "https://localhost:9000/myworkspace/");
  assert.equal(target.authStatePath, resolve(".auth/qa-test.json"));
  assert.equal(readTargetConfig({ BASE_URL: "http://localhost/myworkspace/" }).authStatePath, resolve(".auth/myworkspace-chromium.json"));
});

test("optional credential variables do not enable automatic login", () => {
  const target = readTargetConfig({ BASE_URL: "http://localhost/myworkspace/", LOGIN_USER: "PLACEHOLDER", LOGIN_PASSWORD: "PLACEHOLDER" });
  assert.deepEqual(Object.keys(target).sort(), ["authStatePath", "baseUrl"]);
});

test("explicit credential login rejects missing settings and placeholders", () => {
  assert.throws(() => readLoginCredentials({}), /requires LOGIN_USER/);
  assert.throws(() => readLoginCredentials({ LOGIN_USER: "YOUR_QA_USER", LOGIN_PASSWORD: "YOUR_QA_PASSWORD" }), /placeholders/);
  assert.throws(() => readLoginCredentials({ LOGIN_USER: "sample-qa", LOGIN_PASSWORD: "   " }), /requires LOGIN_USER/);
  assert.deepEqual(
    readLoginCredentials({ LOGIN_USER: " sample-qa ", LOGIN_PASSWORD: " synthetic-test-value " }),
    { user: "sample-qa", password: " synthetic-test-value " }
  );
});

test("state validation reports missing, malformed and invalid files without their contents", () => {
  const directory = mkdtempSync(join(tmpdir(), "myworkspace-support-"));
  const path = join(directory, "state.json");
  try {
    assert.throws(() => validateAuthState(path), /Authentication state is missing/);
    writeFileSync(path, "{private-unparseable-data");
    assert.throws(() => validateAuthState(path), /not valid JSON/);
    writeFileSync(path, JSON.stringify({ cookies: [], origins: "wrong" }));
    assert.throws(() => validateAuthState(path), /invalid Playwright shape/);
    writeFileSync(path, JSON.stringify({ cookies: [], origins: [] }));
    assert.doesNotThrow(() => validateAuthState(path));
  } finally {
    rmSync(path, { force: true });
    rmdirSync(directory);
  }
});
