import dotenv from "dotenv";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

dotenv.config({ quiet: true });

export interface TargetConfig {
  baseUrl: string;
  authStatePath: string;
}

export function readLoginCredentials(env: NodeJS.ProcessEnv = process.env): { user: string; password: string } {
  const user = env.LOGIN_USER?.trim();
  const password = env.LOGIN_PASSWORD;
  if (!user || !password?.trim()) {
    throw new Error("Explicit credential login requires LOGIN_USER and LOGIN_PASSWORD. For manual sign-in use npm run auth:capture.");
  }
  if (/^(YOUR_QA_|PLACEHOLDER)/i.test(user) || /^(YOUR_QA_|PLACEHOLDER)/i.test(password)) {
    throw new Error("Credential placeholders must be replaced privately before using npm run auth:login.");
  }
  return { user, password };
}

export function readTargetConfig(env: NodeJS.ProcessEnv = process.env): TargetConfig {
  const value = env.BASE_URL?.trim();
  if (!value) {
    throw new Error("BASE_URL is missing. Copy .env.example to .env and set your approved My Workspace URL.");
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("BASE_URL must be a complete http:// or https:// My Workspace URL.");
  }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("BASE_URL must use HTTP(S) and must not contain embedded credentials.");
  }
  if (/\.(example|invalid)$/.test(url.hostname) || ["example.com", "example.org"].includes(url.hostname)) {
    throw new Error("BASE_URL is still a placeholder. Supply your approved My Workspace URL.");
  }
  const state = env.AUTH_STATE_PATH?.trim() || ".auth/myworkspace-chromium.json";
  return { baseUrl: url.href, authStatePath: resolve(state) };
}

export function validateAuthState(path: string): void {
  let source: string;
  try {
    source = readFileSync(path, "utf8");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new Error("Authentication state is missing. Run npm run auth:capture, then npm run setup:check.", { cause: error });
    }
    throw new Error("Authentication state could not be read. Check AUTH_STATE_PATH and file permissions.", { cause: error });
  }
  let state: unknown;
  try {
    state = JSON.parse(source);
  } catch {
    throw new Error("Authentication state is not valid JSON. Recapture it with npm run auth:capture.");
  }
  if (typeof state !== "object" || state === null
    || !("cookies" in state) || !Array.isArray(state.cookies)
    || !("origins" in state) || !Array.isArray(state.origins)) {
    throw new Error("Authentication state has an invalid Playwright shape. Run npm run auth:capture.");
  }
}
