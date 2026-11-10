import { createBdd } from "playwright-bdd";
import { test } from "../fixtures";
import { readLoginCredentials } from "../support/config";
import { loginWithCredentials } from "../support/login";
import { expectActivityReady, openActivity } from "../support/myworkspace";

const { Given, When, Then } = createBdd(test);

Given("I have opened my authenticated My Workspace", async ({ page, target }) => {
  await page.goto(target.baseUrl, { waitUntil: "domcontentloaded" });
  await loginWithCredentials(page, target.baseUrl, readLoginCredentials());
});

When("I open Activity", async ({ page }) => {
  await openActivity(page);
});

Then("the Activity page is ready to search", async ({ page }) => {
  await expectActivityReady(page);
});
