import { expect, test, type Page } from "@playwright/test";

const CUSTOMER = { email: "customer@example.com", password: "Customer@123" };
const ADMIN = { email: "admin@shop.com", password: "Admin@12345" };

function collectPageErrors(page: Page): Error[] {
  const errors: Error[] = [];
  page.on("pageerror", (error) => errors.push(error));
  return errors;
}

async function login(page: Page, creds: { email: string; password: string }) {
  await page.goto("/auth/login");
  await page.getByPlaceholder("you@example.com").fill(creds.email);
  await page.getByPlaceholder("••••••••").fill(creds.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  // The header renders the account trigger only for signed-in users.
  await expect(page.locator("header .group > button")).toBeVisible({
    timeout: 15_000,
  });
}

test("storefront loads with data from the services layer", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("Featured products")).toBeVisible();
  expect(errors).toEqual([]);
});

test("login, account back-link, instant logout", async ({ page }) => {
  const errors = collectPageErrors(page);

  await login(page, CUSTOMER);

  // Back navigation from the account dashboard
  await page.goto("/account");
  const backLink = page.getByRole("link", { name: "Back to store" });
  await expect(backLink).toBeVisible();
  await backLink.click();
  await expect(page).toHaveURL(/\/$/);

  // Instant logout — no reload required
  await page.locator("header .group").hover();
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible({
    timeout: 5_000,
  });
  await expect(page).toHaveURL(/\/$/);

  expect(errors).toEqual([]);
});

test("admin dashboard has a back-to-store link", async ({ page }) => {
  const errors = collectPageErrors(page);

  await login(page, ADMIN);
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to store" })).toBeVisible();

  expect(errors).toEqual([]);
});
