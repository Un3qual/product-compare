import { expect, type Page } from "@playwright/test";

import { products, type HomeViewportName } from "./production-ui-home-fixture";
import { expectVisibleFocus, focusByTab } from "./production-ui-home-interactions";

export async function expectHomeVisualSystem(page: Page, viewport: HomeViewportName) {
  const visualSystem = await page.evaluate(() => {
    const find = (selector: string) => document.querySelector<HTMLElement>(selector);
    const shell = document.querySelector<HTMLElement>("section[aria-labelledby]");
    const search = document.querySelector<HTMLElement>('form[role="search"]');
    const categoryLink = document.querySelector<HTMLElement>(
      'ul[aria-label="Product categories"] a',
    );
    const categoryRow = categoryLink?.closest("li");
    const activeTab = document.querySelector<HTMLElement>('[data-slot="detail-tab"][data-active]');
    const activeIndicator = find('[data-slot="tabs-indicator"]');
    const inactiveTab = document.querySelector<HTMLElement>(
      '[data-slot="detail-tab"]:not([data-active])',
    );
    const ledgerRow = document.querySelector<HTMLElement>('ol[aria-label="Product results"] > li');
    const freshness = find('[data-slot="product-ledger-freshness"]');
    const dealReason = find('[data-slot="home-deals-reason"]');
    const shellBox = shell?.getBoundingClientRect();

    return {
      activeIndicator: activeIndicator ? getComputedStyle(activeIndicator).backgroundColor : "",
      activeIndicatorHeight: activeIndicator ? getComputedStyle(activeIndicator).height : "",
      activeTabColor: activeTab ? getComputedStyle(activeTab).color : "",
      activeTabHeight: activeTab?.getBoundingClientRect().height ?? 0,
      categoryBorder: categoryRow ? getComputedStyle(categoryRow).borderBlockStartWidth : "",
      categoryLinkColor: categoryLink ? getComputedStyle(categoryLink).color : "",
      dealReasonIsStatusBadge: dealReason?.dataset.component === "status-badge",
      freshnessBackground: freshness ? getComputedStyle(freshness).backgroundColor : "",
      freshnessHeight: freshness?.getBoundingClientRect().height ?? 0,
      freshnessIsStatusBadge: freshness?.dataset.component === "status-badge",
      inactiveTabColor: inactiveTab ? getComputedStyle(inactiveTab).color : "",
      ledgerBorder: ledgerRow ? getComputedStyle(ledgerRow).borderBlockEndWidth : "",
      searchBackground: search ? getComputedStyle(search).backgroundColor : "",
      shellLeft: shellBox?.left ?? 0,
      shellRight: shellBox ? innerWidth - shellBox.right : 0,
      shellWidth: shellBox?.width ?? 0,
    };
  });

  expect(visualSystem.searchBackground).toBe("rgb(236, 231, 220)");
  expect(visualSystem.categoryLinkColor).toBe("rgb(47, 98, 215)");
  expect(visualSystem.categoryBorder).toBe("1px");
  expect(visualSystem.ledgerBorder).toBe("1px");
  expect(visualSystem.activeIndicator).not.toBe("rgba(0, 0, 0, 0)");
  expect(visualSystem.activeIndicatorHeight).toBe("2px");
  expect(visualSystem.activeTabColor).not.toBe(visualSystem.inactiveTabColor);
  expect(visualSystem.activeTabHeight).toBeGreaterThanOrEqual(44);
  expect(visualSystem.freshnessIsStatusBadge).toBe(true);
  expect(visualSystem.freshnessBackground).not.toBe("rgba(0, 0, 0, 0)");
  expect(visualSystem.freshnessHeight).toBeLessThanOrEqual(32);
  expect(visualSystem.dealReasonIsStatusBadge).toBe(true);

  if (viewport === "desktop") {
    expect(visualSystem.shellWidth).toBeLessThanOrEqual(1_280);
    expect(Math.abs(visualSystem.shellLeft - visualSystem.shellRight)).toBeLessThan(1);
  }
}

export async function expectDesktopLedgerGeometry(page: Page) {
  const headings = page.locator('[data-slot="home-ledger-headings"]');
  await expect(headings).toBeVisible();
  const geometry = await headings.evaluate((headingStrip) => {
    const headingXs = [...headingStrip.children].map(
      (heading) => heading.getBoundingClientRect().x,
    );
    const article = headingStrip.nextElementSibling?.querySelector("article");
    const rowXs = article
      ? [
          "product-ledger-identity",
          "product-ledger-highlights",
          "product-ledger-offer",
          "product-ledger-price-signal",
          "product-ledger-freshness",
          "product-ledger-actions",
        ].map(
          (slot) => article.querySelector(`[data-slot="${slot}"]`)?.getBoundingClientRect().x ?? -1,
        )
      : [];

    const freshness = article
      ?.querySelector('[data-slot="product-ledger-freshness"]')
      ?.getBoundingClientRect();
    const actions = article
      ?.querySelector('[data-slot="product-ledger-actions"]')
      ?.getBoundingClientRect();

    return {
      freshnessActionGap:
        freshness && actions ? Math.round((actions.x - freshness.right) * 100) / 100 : -1,
      headingXs,
      rowXs,
    };
  });

  expect(geometry.headingXs).toHaveLength(6);
  expect(geometry.rowXs).toHaveLength(6);
  geometry.headingXs.forEach((headingX, index) => {
    expect(Math.abs(headingX - (geometry.rowXs[index] ?? -1))).toBeLessThan(1);
  });
  expect(geometry.freshnessActionGap).toBeGreaterThanOrEqual(0);
}

export async function expectTabletLedgerGeometry(page: Page) {
  await expect(page.locator('[data-slot="home-ledger-headings"]')).toBeHidden();
  const article = page.getByRole("article", { name: products[0].name });
  const positions = await article.evaluate((element) => {
    const position = (slot: string) => {
      const box = element.querySelector(`[data-slot="${slot}"]`)?.getBoundingClientRect();
      return box ? { x: box.x, y: box.y } : null;
    };

    return {
      actions: position("product-ledger-actions"),
      freshness: position("product-ledger-freshness"),
      highlights: position("product-ledger-highlights"),
      identity: position("product-ledger-identity"),
      offer: position("product-ledger-offer"),
      signal: position("product-ledger-price-signal"),
    };
  });

  expect(positions.identity?.y).toBe(positions.highlights?.y);
  expect(positions.offer?.y).toBe(positions.signal?.y);
  expect(positions.freshness?.y).toBe(positions.actions?.y);
  expect(positions.identity?.x).toBe(positions.offer?.x);
  expect(positions.offer?.x).toBe(positions.freshness?.x);
  expect(positions.highlights?.x).toBe(positions.signal?.x);
  expect(positions.signal?.x).toBe(positions.actions?.x);

  const widths = await page.getByRole("list", { name: "Product results" }).evaluate((list) => {
    const workspace = list.closest('[aria-label="Product workspace"]');
    const articles = [...list.querySelectorAll("article")];
    const firstArticle = articles[0];
    const identity = firstArticle?.querySelector('[data-slot="product-ledger-identity"]');
    const highlights = firstArticle?.querySelector('[data-slot="product-ledger-highlights"]');
    const box = (element: Element | null | undefined) => element?.getBoundingClientRect();

    return {
      articleWidths: articles.map((element) => element.getBoundingClientRect().width),
      columns: firstArticle ? getComputedStyle(firstArticle).gridTemplateColumns : "",
      highlights: box(highlights),
      identity: box(identity),
      list: list.getBoundingClientRect(),
      workspace: box(workspace),
    };
  });

  expect(Math.abs(widths.list.width - (widths.workspace?.width ?? 0))).toBeLessThan(1);
  expect(widths.list.width).toBeGreaterThan(0);
  expect(widths.columns.split(" ")).toHaveLength(2);
  for (const articleWidth of widths.articleWidths) {
    expect(Math.abs(articleWidth - widths.list.width)).toBeLessThan(1);
  }
  const identityWidth = widths.identity?.width ?? 0;
  const highlightsWidth = widths.highlights?.width ?? 0;
  expect(identityWidth / widths.list.width).toBeGreaterThan(0.4);
  expect(highlightsWidth / widths.list.width).toBeGreaterThan(0.4);
  expect(identityWidth / widths.list.width).toBeLessThan(0.6);
  expect(highlightsWidth / widths.list.width).toBeLessThan(0.6);
  const columnGap = (widths.highlights?.x ?? 0) - ((widths.identity?.x ?? 0) + identityWidth);
  expect(columnGap).toBeGreaterThan(0);
  expect(Math.abs(identityWidth + highlightsWidth + columnGap - widths.list.width)).toBeLessThan(1);
}

export async function expectMobileLedgerDisclosure(page: Page) {
  await expect(page.locator('[data-slot="home-ledger-headings"]')).toBeHidden();
  const article = page.getByRole("article", { name: products[0].name });

  await expect(article.locator('[data-slot="product-ledger-highlights"]')).toBeHidden();
  await expect(article.locator('[data-slot="product-ledger-price-signal"]')).toBeHidden();
  await expect(article.locator('[data-slot="product-ledger-freshness"]')).toBeHidden();
  await expect(article.locator('[data-slot="product-ledger-offer"]')).toBeVisible();
  await expect(article.locator('[data-slot="product-ledger-actions"]')).toBeVisible();

  const trigger = article.getByRole("button", { name: "More details" });
  await focusByTab(page, trigger);
  await expectVisibleFocus(trigger);
  await page.keyboard.press("Space");
  const disclosure = article.locator('[data-slot="collapsible-content"]');
  await expect(disclosure).toBeVisible();
  await expect(disclosure).toContainText(
    "Capacity: 1.0 L · Temperature range: 40–100 °C · Warranty: 2 years",
  );
  await expect(disclosure).toContainText("Below the 30-day price");
  await expect(disclosure).toContainText("Last checked Aug 10, 2026");
  await page.keyboard.press("Space");
  await expect(disclosure).toBeHidden();
  await trigger.evaluate((element) => element.blur());
}

export async function expectDisclosureTargets(page: Page) {
  const disclosures = page.getByRole("button", { name: "More details" });
  await expect(disclosures).toHaveCount(6);
  const heights = await disclosures.evaluateAll((buttons) =>
    buttons.map((button) => button.getBoundingClientRect().height),
  );
  for (const height of heights) expect(height).toBeGreaterThanOrEqual(44);
}
