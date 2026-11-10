import { join } from "node:path";
import { expect, test } from "../fixtures";
import { readLoginCredentials } from "../support/config";
import { loginWithCredentials } from "../support/login";
import { openWorkspace } from "../support/myworkspace";

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page, target }) => {
  test.skip(process.env.RUN_WORKFLOW_TEST !== "true", "Opt in: this test launches a workflow and approves its To-Do.");
  test.setTimeout(25 * 60_000);
  const credentials = readLoginCredentials();
  expect(credentials.user).toBe(process.env.WORKFLOW_USER || "lap");
  const serverError = page.locator(".esko_modal")
    .filter({ has: page.getByRole("heading", { name: "Error", exact: true }) })
    .filter({ has: page.getByText("Server Error", { exact: true }) });
  await page.addLocatorHandler(serverError, async modal => {
    await test.info().attach("dismissed-server-error", {
      body: await modal.innerText(), contentType: "text/plain"
    });
    await modal.getByRole("button", { name: "Close", exact: true }).last().click();
  });
  await page.goto(target.baseUrl, { waitUntil: "domcontentloaded" });
  await loginWithCredentials(page, target.baseUrl, credentials);
});

test.afterEach(async ({ page }, testInfo) => {
  if (page.isClosed() || page.url() === "about:blank") return;
  await page.reload({ waitUntil: "domcontentloaded" });
  const signIn = page.getByRole("heading", { name: "SIGN IN", exact: true });
  await expect(page.locator("#ae_menu_logon").or(signIn)).toBeVisible();
  if (await signIn.isVisible()) return;
  try {
    if (testInfo.title.includes("@Workflow")) {
      await test.step("Remove pending smoke-test To-Dos using Aborted", async () => {
        await page.getByRole("navigation").locator('a[href="#/todos"]').click();
        const galleryReady = page.getByText(/^\d+ to-dos?$/).or(
          page.getByRole("cell", { name: "No items found.", exact: true })
        );
        await expect(galleryReady).toBeVisible();
        const pendingRows = page.getByRole("row")
          .filter({ has: page.getByRole("cell", { name: process.env.WORKFLOW_USER || "lap", exact: true }) })
          .filter({ has: page.getByRole("cell", { name: "smoke test my workspace", exact: true }) })
          .filter({ has: page.getByRole("cell", { name: "Pending", exact: true }) });
        const pendingHrefs = await pendingRows.getByRole("link", { name: "smoke test my workspace", exact: true })
          .evaluateAll(links => links.map(link => link.getAttribute("href")));
        for (const href of pendingHrefs) {
          expect(href).toBeTruthy();
          await page.goto(new URL(href!, page.url()).href);
          await page.getByRole("button", { name: "Aborted", exact: true }).click();
          await expect(page.getByRole("heading", { name: "To Do", exact: true })).toBeVisible();
          await expect(galleryReady).toBeVisible();
          await expect(page.locator(`a[href="${href}"]`)).toHaveCount(0);
        }
        await expect(pendingRows).toHaveCount(0);
      });
    }
  } finally {
    await test.step("Sign out after cleanup", async () => {
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.locator("#ae_menu_logon").click();
      await page.getByRole("link", { name: "Sign Out", exact: true }).click();
      await expect(signIn).toBeVisible();
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(signIn).toBeVisible();
    });
  }
});

test("Fresh workflow login signs out after completion @MyWorkspace @Authentication", async ({ page }) => {
  await expect(page.getByRole("navigation").getByRole("link", { name: "Activity", exact: true })).toBeVisible();
});

test("Launch workflow and complete its To-Do @MyWorkspace @Workflow", async ({ page, target }) => {
  const inputDirectory = process.env.WORKFLOW_INPUT_DIR;
  expect(inputDirectory, "Set WORKFLOW_INPUT_DIR to the directory containing launchfile_1.pdf and launchfile_2.pdf.").toBeTruthy();
  await openWorkspace(page, target.baseUrl);
  await page.getByRole("navigation").getByRole("link", { name: "Drop File", exact: true }).click();
  const accountUser = page.locator(".esko_formrow").filter({
    has: page.getByText("User Name", { exact: true })
  }).getByText(process.env.WORKFLOW_USER || "lap", { exact: true });
  await expect(accountUser).toHaveCount(1);
  await page.getByRole("navigation").locator('a[href="#/todos"]').click();
  await expect(page.getByText(/^\d+ to-dos?$/).or(
    page.getByRole("cell", { name: "No items found.", exact: true })
  )).toBeVisible();
  const previousTodoHrefs = new Set(await page.locator('a[href^="#/todo?id="]').evaluateAll(links =>
    links.map(link => link.getAttribute("href"))));
  await page.getByRole("navigation").getByRole("link", { name: "Activity", exact: true }).click();
  await expect(page.getByText(/^\d+ workflows?$/).or(
    page.getByRole("cell", { name: "No items found.", exact: true })
  )).toBeVisible();
  const previousDetails = new Set(await page.locator('a[href*="taskid="]').evaluateAll(links =>
    links.map(link => link.getAttribute("href"))));
  await page.getByRole("navigation").getByRole("link", { name: "Drop File", exact: true }).click();
  const dropZone = page.locator("[draggable='true']").filter({
    has: page.locator('[title="smoke test my workspace"]')
  });
  await expect(dropZone).toHaveCount(1);
  await dropZone.locator('input[type="file"]').setInputFiles(join(inputDirectory!, "launchfile_1.pdf"));
  await expect(page.getByRole("heading", { name: "Launch Workflow", exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Workflow", exact: true })).toHaveValue("smoke test my workspace");
  await page.getByRole("textbox", { name: "Trap Distance", exact: true }).fill("0.5 mm");
  await page.getByRole("button", { name: "Launch Options", exact: true }).click();
  await page.getByRole("button", { name: "Normal", exact: true }).click();
  await page.getByRole("button", { name: "High", exact: true }).click();
  await expect(page.getByRole("button", { name: "High", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Immediately", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Workflow", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Trap Distance", exact: true })).toHaveValue("0.5 mm");
  await page.getByRole("button", { name: "Files", exact: true }).click();
  await page.locator("#add-dropped-files-button").setInputFiles(join(inputDirectory!, "launchfile_2.pdf"));
  await expect(page.getByRole("cell", { name: "launchfile_1.pdf", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "launchfile_2.pdf", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Launch", exact: true }).click();
  const notificationLink = page.getByRole("link", { name: "Show Details in Activity View", exact: true })
    .and(page.locator("a:not(#ae_slideout_notifications a)"));
  await expect(notificationLink).toBeInViewport();
  await notificationLink.click();
  await expect(page.getByRole("heading", { name: "Activity", exact: true })).toBeVisible();

  const matchingRows = page.getByRole("row")
    .filter({ hasText: "smoke test my workspace" })
    .filter({ hasText: "launchfile_1.pdf, launchfile_2.pdf" });
  let detailsHref: string | undefined;
  await expect.poll(async () => {
    const links = await matchingRows.locator('a[href*="taskid="]').evaluateAll(elements =>
      elements.map(element => element.getAttribute("href")));
    const newLinks = links.filter((href): href is string => href !== null && !previousDetails.has(href));
    detailsHref = newLinks[0];
    return newLinks.length;
  }, { message: "Find exactly one newly launched workflow", timeout: 30_000 }).toBe(1);
  const detailsLink = page.locator(`a[href="${detailsHref}"]`);
  const workflowRow = page.getByRole("row").filter({ has: detailsLink });
  let observedState: string | null = null;
  try {
    await expect.poll(async () => {
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(workflowRow).toBeVisible({ timeout: 5_000 });
      observedState = await workflowRow.getByRole("cell").nth(3).locator("[title]")
        .getAttribute("title", { timeout: 5_000 });
      return observedState;
    }, {
      message: "Refresh Activity until this workflow is waiting for its checkpoint",
      timeout: 60_000,
      intervals: [1_000, 2_000, 5_000]
    }).toBe("Waiting to be handled");
  } finally {
    await test.info().attach("observed-workflow-state", {
      body: JSON.stringify({ detailsHref, observedState }), contentType: "application/json"
    });
    await test.info().attach("activity-before-cleanup", {
      body: await page.screenshot(), contentType: "image/png"
    });
  }
  const state = workflowRow.locator('[title="Waiting to be handled"]');
  await state.hover({ timeout: 60_000 });
  await expect(state).toHaveAttribute("title", "Waiting to be handled");
  await detailsLink.click();
  await expect(page.getByRole("heading", { name: "Workflow Details", exact: true })).toBeVisible();
  const download = page.locator('a[href*="downloadUrl"]');
  const downloadHref = await download.first().getAttribute("href");
  expect(downloadHref).toBeTruthy();
  const inputFileUrl = new URL(downloadHref!, page.url()).searchParams.get("url");
  expect(inputFileUrl).toBeTruthy();
  await test.info().attach("workflow-details", { body: page.url(), contentType: "text/plain" });
  await page.getByRole("button", { name: "Messages", exact: true }).click();
  try {
    await expect.poll(async () => {
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(page.locator("table").last().getByRole("row")
        .filter({ hasNotText: /Loading\.\.\./ }).first()).toBeVisible({ timeout: 5_000 });
      return page.getByRole("cell", { name: "Checkpoint is added to the To Do List!", exact: true }).count();
    }, { message: "Wait for AE to create the approval checkpoint", timeout: 60_000, intervals: [2_000, 5_000] }).toBe(1);
  } finally {
    await test.info().attach("workflow-messages", {
      body: await page.locator("table").last().innerText(), contentType: "text/plain"
    });
  }
  await expect(page.getByRole("row").locator('[title="Error"]')).toHaveCount(0);

  await page.getByRole("navigation").locator('a[href="#/todos"]').click();
  const todoLinks = page.getByRole("row")
    .filter({ has: page.getByRole("cell", { name: process.env.WORKFLOW_USER || "lap", exact: true }) })
    .filter({ has: page.getByRole("cell", { name: "Pending", exact: true }) })
    .getByRole("link", { name: "smoke test my workspace", exact: true });
  let completedTodoHref: string | undefined;
  await expect.poll(async () => {
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByText(/^\d+ to-dos?$/).or(
      page.getByRole("cell", { name: "No items found.", exact: true })
    )).toBeVisible({ timeout: 5_000 });
    const hrefs = await todoLinks.evaluateAll(links => links.map(link => link.getAttribute("href")));
    const newHrefs = hrefs.filter((href): href is string => href !== null && !previousTodoHrefs.has(href));
    completedTodoHref = newHrefs[0];
    return newHrefs.length;
  }, { message: "Find exactly one new smoke-test To-Do", timeout: 60_000, intervals: [2_000, 5_000] }).toBe(1);
  await page.getByRole("link", { name: "smoke test my workspace", exact: true })
    .and(page.locator(`a[href="${completedTodoHref}"]`)).click();
  await expect(page.getByRole("button", { name: "Completed", exact: true })).toBeVisible();
  const fileRow = page.getByRole("row").filter({
    has: page.getByRole("cell", { name: "launchfile_1.pdf", exact: true })
  });
  await expect(fileRow.locator("[title]").first()).toHaveAttribute("title", inputFileUrl!, { ignoreCase: true });
  await expect(page.getByRole("cell", { name: "launchfile_2.pdf", exact: true })).toBeVisible();
  await fileRow.locator('a[href^="#/viewer?"]').click();
  await expect(page).toHaveTitle("launchfile_1.pdf");
  const preview = page.locator("#default_Main_Graphics");
  await expect(preview).toBeVisible({ timeout: 120_000 });
  await expect.poll(() => preview.evaluate((canvas: HTMLCanvasElement) => {
    const context = canvas.getContext("2d");
    if (!context || !canvas.width || !canvas.height) return 0;
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const colors = new Set<number>();
    for (let index = 0; index < pixels.length; index += 64) {
      colors.add((pixels[index] << 16) | (pixels[index + 1] << 8) | pixels[index + 2]);
    }
    return colors.size;
  }), { message: "PDF preview must contain rendered content", timeout: 120_000 }).toBeGreaterThan(8);
  await test.info().attach("viewed-file", { body: await page.screenshot(), contentType: "image/png" });
  await page.goBack();
  await page.getByRole("button", { name: "Completed", exact: true }).click();
  await expect(page.getByRole("heading", { name: "To Do", exact: true })).toBeVisible();
  await expect(page.getByRole("row", { name: "Loading...", exact: true })).toHaveCount(0);
  await expect(page.locator(`a[href="${completedTodoHref}"]`)).toHaveCount(0);
});