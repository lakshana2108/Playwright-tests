import { createBdd } from "playwright-bdd";
import type { Page } from "@playwright/test";
import { expect, test } from "../fixtures";
import { readLoginCredentials } from "../support/config";
import { loginWithCredentials } from "../support/login";

const { Given, When, Then, BeforeScenario, AfterScenario } = createBdd(test);
const scenarios = new WeakMap<Page, {
  previousTodos: Set<string | null>;
  todoHref?: string;
  globalProductCount: string;
  previewParts: string[];
}>();

BeforeScenario("@JobContext", async () => {
  test.skip(process.env.RUN_JOB_CONTEXT_TEST !== "true", "Opt in: this scenario launches a workflow and forwards its To-Do.");
  test.setTimeout(5 * 60_000);
});

AfterScenario("@JobContext", async ({ page, target }) => {
  if (page.isClosed() || page.url() === "about:blank") return;
  await page.setViewportSize({ width: 1440, height: 900 });
  const signIn = page.getByRole("heading", { name: "SIGN IN", exact: true });
  try {
    const todoHref = scenarios.get(page)?.todoHref;
    if (todoHref) {
      await page.goto(new URL(todoHref, target.baseUrl).href);
      await page.getByRole("button", { name: "Aborted", exact: true }).click();
      await expect(page.getByRole("heading", { name: "To Do", exact: true })).toBeVisible();
    }
  } finally {
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("#ae_menu_logon").or(signIn)).toBeVisible();
    if (!(await signIn.isVisible())) {
      await page.locator("#ae_menu_logon").click();
      await page.getByRole("link", { name: "Sign Out", exact: true }).click();
      await expect(signIn).toBeVisible();
      await page.addLocatorHandler(page.getByRole("heading", { name: "Your session has expired", exact: true }), async () => {
        await page.getByRole("button", { name: "OK", exact: true }).click();
      });
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(signIn).toBeVisible();
    }
    scenarios.delete(page);
  }
});

Given("I sign in freshly for the job context scenario", async ({ page, target }) => {
  await page.goto(target.baseUrl, { waitUntil: "domcontentloaded" });
  await loginWithCredentials(page, target.baseUrl, readLoginCredentials());
  await page.getByRole("navigation").getByRole("link", { name: "Products", exact: true }).click();
  const count = page.getByText(/^\d+ products?$/);
  await expect(count).toBeVisible();
  const globalProductCount = await count.innerText();
  await page.getByRole("navigation").locator('a[href^="#/todos"]').click();
  await expect(page.getByText(/^\d+ to-dos?$/).or(page.getByRole("cell", { name: "No items found.", exact: true }))).toBeVisible();
  scenarios.set(page, {
    globalProductCount,
    previewParts: [],
    previousTodos: new Set(await page.locator('a[href^="#/todo?id="]').evaluateAll(links => links.map(link =>
      new URLSearchParams(link.getAttribute("href")!.split("?")[1]).get("id"))))
  });
});

When("I select my job in Jobs", async ({ page }) => {
  await page.getByRole("navigation").getByRole("link", { name: "Jobs", exact: true }).click();
  await page.getByRole("row").getByText(process.env.JOB_CONTEXT_NAME || "Job_lap", { exact: true }).first().click();
});

Then("Files opens automatically for that job", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Files", exact: true, level: 1 })).toBeVisible();
  await expect(page.locator(".shared-jobcontext-name")).toHaveText(process.env.JOB_CONTEXT_NAME || "Job_lap");
});

Then("the blue job context banner is visible", async ({ page }) => {
  const banner = page.locator(".infobar-jobcontext-banner");
  await expect(banner).toBeVisible();
  await expect(page.locator(".esko_infobar.job")).toHaveCSS("background-color", "rgb(204, 224, 255)");
});

Then("Jobs does not display the job context banner", async ({ page }) => {
  await page.getByRole("navigation").getByRole("link", { name: "Jobs", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Jobs", exact: true, level: 1 })).toBeVisible();
  await expect(page.locator(".infobar-jobcontext-banner")).toHaveCount(0);
  await page.getByRole("navigation").getByRole("link", { name: "Files", exact: true }).click();
  await expect(page.locator(".infobar-jobcontext-banner")).toBeVisible();
});

Then("only files and folders inside the selected job are visible", async ({ page }) => {
  await expect(page.getByRole("link", { name: "Smoke Test for BrowserMyWorkspace", exact: true })).toBeVisible();
  await expect(page.getByRole("row", { name: "Loading...", exact: true })).toHaveCount(0);
  const current = new URLSearchParams(page.url().split("?")[1]);
  const root = current.get("folder");
  expect(root).toBeTruthy();
  const folders = await page.getByRole("row").locator('a[href*="folder="]').evaluateAll(links =>
    links.map(link => new URLSearchParams(link.getAttribute("href")!.split("?")[1]).get("folder")));
  expect(folders.length).toBeGreaterThan(0);
  for (const folder of folders) expect(folder?.startsWith(`${root}/`)).toBe(true);
  await expect(page.getByRole("heading", { name: "Containers", exact: true })).toHaveCount(0);
});

When("I launch a file from that job", async ({ page }) => {
  await page.getByRole("link", { name: "Smoke Test for BrowserMyWorkspace", exact: true }).click();
  await page.getByRole("link", { name: "input files", exact: true }).click();
  const fileRow = page.getByRole("row").filter({
    has: page.getByRole("cell", { name: process.env.JOB_CONTEXT_FILE || "launchfile_1.pdf", exact: true })
  });
  await fileRow.getByRole("cell").first().click();
  await fileRow.locator('[title="Launch"]').click();
  await expect(page.getByRole("heading", { name: "Launch Workflow", exact: true })).toBeVisible();
});

When("I choose the workflow {string}", async ({ page }, workflow: string) => {
  await page.getByRole("textbox", { name: "Workflow", exact: true }).fill(workflow);
  await page.getByText(workflow, { exact: true }).filter({ visible: true }).click();
  await expect(page.getByRole("textbox", { name: "Workflow", exact: true })).toHaveValue(workflow);
  await expect(page.getByRole("button", { name: "Launch", exact: true })).toBeEnabled();
});

When("I submit the job workflow", async ({ page }) => {
  await page.getByRole("button", { name: "Launch", exact: true }).click();
  await expect(page.getByRole("link", { name: "Show Details in Activity View", exact: true })
    .and(page.locator("a:not(#ae_slideout_notifications a)"))).toBeVisible();
  await page.getByRole("navigation").locator('a[href^="#/todos"]').click();
});

Then("the new To-Do is owned by the signed-in user", async ({ page }) => {
  const scenario = scenarios.get(page)!;
  const todoLinks = page.getByRole("row")
    .filter({ has: page.getByRole("cell", { name: readLoginCredentials().user, exact: true }) })
    .filter({ has: page.getByRole("cell", { name: "Pending", exact: true }) })
    .getByRole("link", { name: "smoke test my workspace", exact: true });
  await expect.poll(async () => {
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByText(/^\d+ to-dos?$/).or(page.getByRole("cell", { name: "No items found.", exact: true }))).toBeVisible();
    const newHrefs = (await todoLinks.evaluateAll(links => links.map(link => link.getAttribute("href")!)))
      .filter(href => !scenario.previousTodos.has(new URLSearchParams(href.split("?")[1]).get("id")));
    if (newHrefs.length === 1) scenario.todoHref = newHrefs[0];
    return newHrefs.length;
  }, { message: "Find the new job-context To-Do owned by the signed-in user", timeout: 30_000, intervals: [1_000, 2_000, 5_000] }).toBe(1);
  const row = page.getByRole("row").filter({ has: page.locator(`a[href="${scenario.todoHref}"]`) });
  await expect(row.getByRole("cell", { name: readLoginCredentials().user, exact: true })).toBeVisible();
});

When("I open the new To-Do forward action", async ({ page }) => {
  const row = page.getByRole("row").filter({ has: page.locator(`a[href="${scenarios.get(page)!.todoHref}"]`) });
  await row.locator('[title="Forward to-do"]').click();
  await expect(page.getByRole("textbox", { name: "To", exact: true })).toBeVisible();
});

When("I forward the To-Do to {string}", async ({ page }, owner: string) => {
  const recipientInput = page.getByRole("textbox", { name: "To", exact: true });
  await page.locator(".esko_resourceinput").filter({ has: recipientInput })
    .getByRole("button").filter({ has: page.locator(".esko_icon-more") }).click();
  const picker = page.locator(".esko_modal").filter({
    has: page.getByRole("heading", { name: "Select user", exact: true })
  });
  await expect(picker).toBeVisible();
  const recipient = picker.getByRole("row").filter({
    has: page.getByRole("cell", { name: owner, exact: true })
  });
  await expect(recipient, `Expected ${owner} in the Select user list.`).toHaveCount(1);
  await recipient.scrollIntoViewIfNeeded();
  await recipient.click();
  await expect(picker.getByRole("button", { name: "OK", exact: true })).toBeEnabled();
  await test.info().attach("selected-forward-recipient", { body: await page.screenshot(), contentType: "image/png" });
  await picker.getByRole("button", { name: "OK", exact: true }).click();
  await expect(picker).toHaveCount(0);
  await page.getByRole("button", { name: "OK", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "To", exact: true })).toHaveCount(0);
});

Then("the owner of that To-Do changes to {string}", async ({ page }, owner: string) => {
  const row = page.getByRole("row").filter({ has: page.locator(`a[href="${scenarios.get(page)!.todoHref}"]`) });
  await expect.poll(async () => {
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByText(/^\d+ to-dos?$/).or(page.getByRole("cell", { name: "No items found.", exact: true }))).toBeVisible();
    return row.getByRole("cell", { name: owner, exact: true }).count();
  }, { message: `Refresh the new To-Do until its owner is ${owner}`, timeout: 30_000, intervals: [1_000, 2_000, 5_000] }).toBe(1);
  await expect(row.getByRole("cell", { name: owner, exact: true })).toBeVisible();
  await expect(row.getByRole("cell", { name: readLoginCredentials().user, exact: true })).toHaveCount(0);
  await test.info().attach("forwarded-to-admin", { body: await page.screenshot(), contentType: "image/png" });
});

When("I open Products in the job context", async ({ page }) => {
  await page.getByRole("navigation").getByRole("link", { name: "Products", exact: true }).click();
  await expect(page.locator(".infobar-jobcontext-banner")).toBeVisible();
});

Then("only the selected job products are visible", async ({ page }) => {
  const names = (process.env.JOB_CONTEXT_PRODUCTS || "jobfile|multipart product_lap").split("|");
  await expect(page.getByText(/^\d+ products?$/)).toHaveText(`${names.length} products`);
  await expect(page.locator(".esko_tiletextlink")).toHaveText(names);
});

When("I close the job context", async ({ page }) => {
  await page.getByRole("button", { name: "Close Job", exact: true }).click();
});

Then("the job context banner disappears", async ({ page }) => {
  await expect(page.locator(".infobar-jobcontext-banner")).toHaveCount(0);
  await expect(page).not.toHaveURL(/jobcontext=/);
});

Then("the unfiltered products and files are available again", async ({ page }) => {
  await expect(page.getByText(/^\d+ products?$/)).toHaveText(scenarios.get(page)!.globalProductCount);
  await page.getByRole("navigation").getByRole("link", { name: "Files", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Files", exact: true, level: 1 })).toBeVisible();
  await expect(page.locator(".infobar-jobcontext-banner")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Containers", exact: true })).toBeVisible();
  await expect(page).not.toHaveURL(/jobcontext=/);
  await page.getByRole("navigation").getByRole("link", { name: "Products", exact: true }).click();
  await expect(page.getByText(/^\d+ products?$/)).toHaveText(scenarios.get(page)!.globalProductCount);
});

When("I open the multipart product details call-out", async ({ page }) => {
  const productName = process.env.JOB_CONTEXT_MULTIPART_PRODUCT || "multipart product_lap";
  await page.getByRole("searchbox", { name: "Search", exact: true }).fill(productName);
  const product = page.getByRole("link", { name: productName, exact: true });
  const tile = page.locator(".esko_tileandtiletextcontainer").filter({ has: product });
  await tile.locator(".esko_previewoverlay").click({ position: { x: 30, y: 30 } });
  const panel = page.locator("#ae_products_preview_panel");
  await expect(panel).toBeVisible();
  await expect.poll(() => panel.locator(".commonresources-previewtile").count()).toBeGreaterThan(1);
  scenarios.get(page)!.previewParts = await panel.locator(".esko_tiletext").allTextContents();
  await test.info().attach("multipart-desktop", { body: await page.screenshot(), contentType: "image/png" });
});

When("I reduce the browser width to {int} pixels", async ({ page }, width: number) => {
  await page.setViewportSize({ width, height: 800 });
  await expect(page.locator("#ae_products_preview_panel")).toBeVisible();
  await expect(page.locator("#ae_products_preview_panel .commonresources-previewtile")).toHaveCount(1);
});

Then("I can browse all multipart product previews", async ({ page }) => {
  const panel = page.locator("#ae_products_preview_panel");
  const parts = panel.locator(".commonresources-previewtile");
  const expectedParts = scenarios.get(page)!.previewParts;
  expect(expectedParts.length).toBeGreaterThan(1);
  for (let index = 0; index < expectedParts.length; index++) {
    if (index > 0) await page.locator("#ae_button_product_preview_arrow_right").click();
    await expect(parts.locator(".esko_tiletext")).toHaveText(expectedParts[index]);
    await expect(parts).toBeInViewport();
    await expect.poll(() => parts.locator("img").evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    await test.info().attach(`multipart-narrow-part-${index + 1}`, { body: await page.screenshot(), contentType: "image/png" });
  }
  await expect(page.locator("#ae_button_product_preview_arrow_right")).toHaveCount(0);
  for (let index = expectedParts.length - 2; index >= 0; index--) {
    await page.locator("#ae_button_product_preview_arrow_left").click();
    await expect(parts.locator(".esko_tiletext")).toHaveText(expectedParts[index]);
  }
  await expect(page.locator("#ae_button_product_preview_arrow_left")).toHaveCount(0);
});