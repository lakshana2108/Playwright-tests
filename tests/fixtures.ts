import { test as base } from "playwright-bdd";
import { readTargetConfig, validateAuthState, type TargetConfig } from "./support/config";

export const test = base.extend<{ target: TargetConfig }>({
  target: async ({}, use) => {
    await use(readTargetConfig());
  },
  storageState: async ({ target, $tags }, use) => {
    if ($tags.includes("@JobContext") || $tags.includes("@FreshLogin")) {
      await use({ cookies: [], origins: [] });
      return;
    }
    validateAuthState(target.authStatePath);
    await use(target.authStatePath);
  }
});

export { expect } from "@playwright/test";
