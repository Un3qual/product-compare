import { expect, test } from "@playwright/test";
import { gotoHydratedRoute } from "./client-navigation";

test("home route responds", async ({ page }) => {
  await gotoHydratedRoute(page, "/");
  await expect(page.getByRole("heading", { name: "Find the right product" })).toBeVisible();
  await expect(page).toHaveTitle("Product Compare");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "Choose products with clearer specifications and current offers.",
  );
});
