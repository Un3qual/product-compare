import { expect, test } from "@playwright/test";

test("home route responds", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Product Compare" })).toBeVisible();
});
