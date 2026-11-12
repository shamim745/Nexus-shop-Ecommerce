import { expect, test } from "@playwright/test";

test("debug store after logout", async ({ page }) => {
  page.on("pageerror", (err) => console.log("PAGEERROR:", err.message));
  page.on("response", (res) => {
    if (res.url().includes("/api/auth") || res.url().includes("/api/cart")) {
      console.log("NET:", res.status(), res.request().method(), res.url().replace("http://localhost:5173", ""));
    }
  });

  await page.goto("/auth/login");
  await page.getByPlaceholder("you@example.com").fill("customer@example.com");
  await page.getByPlaceholder("••••••••").fill("Customer@123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator("header .group > button")).toBeVisible({ timeout: 15_000 });

  await page.goto("/account");
  await page.getByRole("link", { name: "Back to store" }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.locator("header .group").hover();
  await page.getByRole("button", { name: "Log out" }).click();
  await page.waitForTimeout(3000);

  const state = await page.evaluate(() => {
    const s = (window as unknown as { __store?: { getState: () => unknown } }).__store;
    if (!s) return { error: "no store" };
    const root = s.getState() as { api: { queries: Record<string, unknown>; mutations: Record<string, unknown> } };
    return {
      queryKeys: Object.keys(root.api.queries),
      meEntry: root.api.queries["getMe(undefined)"],
      mutationKeys: Object.keys(root.api.mutations),
    };
  });
  console.log("STORE:", JSON.stringify(state, null, 2).slice(0, 2000));

  const signIn = await page.getByRole("link", { name: "Sign in" }).count();
  const group = await page.locator("header .group").count();
  console.log(`RESULT signIn=${signIn} group=${group}`);
});
