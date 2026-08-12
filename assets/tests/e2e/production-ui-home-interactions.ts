import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export async function focusByTab(
  page: Page,
  target: ReturnType<Page["locator"]>,
  { key = "Tab", maxPresses = 40 }: { key?: "Shift+Tab" | "Tab"; maxPresses?: number } = {},
) {
  for (let index = 0; index < maxPresses; index += 1) {
    await page.keyboard.press(key);
    if (await target.evaluate((element) => element === document.activeElement)) return;
  }

  throw new Error(
    `Keyboard traversal did not reach the target within ${maxPresses} ${key} presses`,
  );
}

export async function expectVisibleFocus(target: ReturnType<Page["locator"]>) {
  await expect
    .poll(() =>
      target.evaluate((element) => {
        const candidates = [element, element.parentElement].filter(
          (candidate): candidate is Element => candidate !== null,
        );

        return candidates.some((candidate) => {
          const style = getComputedStyle(candidate);
          return (
            candidate.matches(":focus-visible") &&
            style.outlineStyle === "solid" &&
            Number.parseFloat(style.outlineWidth) >= 2
          );
        });
      }),
    )
    .toBe(true);
}

export async function waitForFonts(page: Page) {
  expect(
    await page.evaluate(async () => {
      const [sansFaces, monoFaces] = await Promise.all([
        document.fonts.load('400 16px "Instrument Sans Variable"', "Product workbench"),
        document.fonts.load('400 16px "IBM Plex Mono"', "Product"),
      ]);
      await document.fonts.ready;

      return {
        bodyFamily: getComputedStyle(document.body).fontFamily,
        mono: monoFaces.length > 0,
        sans: sansFaces.length > 0,
      };
    }),
  ).toEqual({
    bodyFamily:
      '"Instrument Sans Variable", ui-sans-serif, system-ui, -apple-system, "system-ui", "Segoe UI", sans-serif',
    mono: true,
    sans: true,
  });
}

export function plainLanguageViolations(page: Page) {
  return page.locator("body").evaluate((body) => {
    const forbidden = [
      "current attributes",
      "dataloader",
      "ecto",
      "evidence",
      "graphql",
      "identity count",
      "merchant product",
      "persisted snapshot",
      "qualification",
      "recommendation profile",
      "relay",
      "resolver",
      "source artifact",
      "taxon",
    ];
    const visibleCopy = body.innerText.toLowerCase();
    return forbidden.filter((term) => visibleCopy.includes(term));
  });
}

export async function expectMobileNavigation(page: Page) {
  const primary = page.getByRole("navigation", { name: "Primary" });
  const search = primary.getByRole("link", { name: "Search products" });
  const menu = primary.getByRole("button", { name: "Menu" });
  const brand = primary.getByRole("link", { name: "Product Compare" });
  const boxes = await Promise.all([brand, search, menu].map((control) => control.boundingBox()));

  for (const [index, box] of boxes.entries()) {
    expect(box?.height ?? 0, ["Brand", "Search", "Menu"][index]).toBeGreaterThanOrEqual(44);
  }
  expect(boxes[0]?.y).toBe(boxes[1]?.y);
  expect(boxes[1]?.y).toBe(boxes[2]?.y);
  expect((await primary.boundingBox())?.height ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(72);

  await focusByTab(page, menu);
  await expectVisibleFocus(menu);
  await page.keyboard.press("Space");
  const menuNavigation = page.getByRole("navigation", { name: "Menu navigation" });
  await expect(menuNavigation.locator("..")).toHaveAttribute("role", "dialog");
  await expect(menuNavigation.getByRole("link", { name: "Compare products" })).toBeVisible();
  await expect(menuNavigation.getByRole("link", { name: "Offers" })).toBeVisible();
  await expect(menuNavigation.getByRole("link", { name: "Merchants" })).toBeVisible();
  await expect(menuNavigation.getByRole("link", { name: "Sign in" })).toBeVisible();
  await expect(menuNavigation.getByRole("link", { name: "Create account" })).toBeVisible();
  const openMenuAccessibility = await new AxeBuilder({ page }).analyze();
  expect(openMenuAccessibility.violations).toEqual([]);
  const viewport = page.viewportSize();
  await page.mouse.click((viewport?.width ?? 390) - 8, (viewport?.height ?? 844) - 8);
  await expect(menuNavigation).toBeHidden();

  await menu.click();
  await expect(menuNavigation).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menuNavigation).toBeHidden();
  await expect(menu).toBeFocused();
  await menu.evaluate((element) => element.blur());
}
