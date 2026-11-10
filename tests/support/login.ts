import { expect, type Page } from "@playwright/test";
import { selectMyWorkspace } from "./myworkspace";

export async function loginWithCredentials(
  page: Page,
  baseUrl: string,
  credentials: { user: string; password: string }
): Promise<void> {
  if (new URL(page.url()).origin !== new URL(baseUrl).origin) {
    throw new Error("Credential login only supports the configured local AE login origin. Use manual capture for external SSO/MFA.");
  }
  await expect(page.getByRole("heading", { name: "SIGN IN", exact: true })).toBeVisible();
  // These verified inputs have no accessible label in the inspected AE form.
  await page.locator("#ae_input_login_username").fill(credentials.user);
  await page.locator("#ae_input_login_password").fill(credentials.password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await selectMyWorkspace(page, 30_000);
}
