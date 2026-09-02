import { expect, test } from "@playwright/test";
import { gotoClientRoute } from "./client-navigation";

test("home route responds", async ({ page }) => {
  await gotoClientRoute(page, "/");
  await expect(page.getByRole("heading", { name: "Find the right product" })).toBeVisible();
});
