import { readTargetConfig, validateAuthState } from "../tests/support/config";

try {
  const target = readTargetConfig();
  validateAuthState(target.authStatePath);
  console.log("Local settings and state-file shape are valid. Run a smoke test to verify connectivity and session validity.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Setup validation failed with a non-Error value.");
  process.exitCode = 1;
}
