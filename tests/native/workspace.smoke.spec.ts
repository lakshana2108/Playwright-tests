import { test } from "../fixtures";
import { readLoginCredentials } from "../support/config";
import { loginWithCredentials } from "../support/login";
import { expectActivityReady, openActivity } from "../support/myworkspace";

test.use({ storageState: { cookies: [], origins: [] } });

test("Authenticated user can open Activity @MyWorkspace @Smoke @Regression @DomainWorkspace", async ({ page, target }) => {
  await page.goto(target.baseUrl, { waitUntil: "domcontentloaded" });
  await loginWithCredentials(page, target.baseUrl, readLoginCredentials());
  await openActivity(page);
  await expectActivityReady(page);
});
