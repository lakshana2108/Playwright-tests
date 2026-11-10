import { expect, type Page } from "@playwright/test";

export async function expectAuthenticatedWorkspace(page: Page, timeout = 15_000): Promise<void> {
  await expect(
    page.getByRole("navigation").getByRole("link", { name: "Activity", exact: true }),
    "Expected authenticated My Workspace navigation. If SIGN IN is shown, run npm run auth:capture. Otherwise check UI language/version and account permissions."
  ).toBeVisible({ timeout });
}

export async function selectMyWorkspace(page: Page, timeout = 15_000): Promise<void> {
  const workspaceLink = page.getByRole("link", {
    name: "My Workspace",
    exact: true,
    description: "Go to My Workspace"
  });
  await expect(workspaceLink).toBeVisible({ timeout });
  await workspaceLink.click();
  await expectAuthenticatedWorkspace(page, timeout);
}

export async function openWorkspace(page: Page, baseUrl: string): Promise<void> {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await selectMyWorkspace(page);
}

export async function openActivity(page: Page): Promise<void> {
  await page.getByRole("navigation").getByRole("link", { name: "Activity", exact: true }).click();
}

export async function expectActivityReady(page: Page): Promise<void> {
  await expect(page.getByRole("heading", { name: "Activity", exact: true, level: 1 })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Search", exact: true })).toBeVisible();
}
