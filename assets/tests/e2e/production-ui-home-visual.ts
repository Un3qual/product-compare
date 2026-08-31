import { expect, type Page } from "@playwright/test";

import { products, type HomeViewportName } from "./production-ui-home-fixture";

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
  await expect(page.locator('[data-slot="home-ledger-headings"]')).toHaveCount(0);
  const article = page.getByRole("article", { name: products[0].name });
  const geometry = await article.evaluate((element) => {
    const box = (slot: string) =>
      element.querySelector(`[data-slot="${slot}"]`)?.getBoundingClientRect() ?? null;

    return {
      actions: box("product-ledger-actions"),
      market: box("product-ledger-market"),
      summary: box("product-ledger-summary"),
    };
  });

  expect(geometry.summary?.y).toBe(geometry.market?.y);
  expect(geometry.market?.y).toBe(geometry.actions?.y);
  expect((geometry.market?.x ?? 0) - (geometry.summary?.right ?? 0)).toBeGreaterThan(0);
  expect((geometry.actions?.x ?? 0) - (geometry.market?.right ?? 0)).toBeGreaterThan(0);
}

export async function expectTabletLedgerGeometry(page: Page) {
  await expect(page.locator('[data-slot="home-ledger-headings"]')).toHaveCount(0);
  const article = page.getByRole("article", { name: products[0].name });
  const positions = await article.evaluate((element) => {
    const position = (slot: string) => {
      const box = element.querySelector(`[data-slot="${slot}"]`)?.getBoundingClientRect();
      return box ? { x: box.x, y: box.y } : null;
    };

    return {
      actions: position("product-ledger-actions"),
      market: position("product-ledger-market"),
      summary: position("product-ledger-summary"),
    };
  });

  expect(positions.summary?.x).toBe(positions.market?.x);
  expect(positions.summary?.y).toBeLessThan(positions.market?.y ?? 0);
  expect(positions.actions?.x).toBeGreaterThan(positions.summary?.x ?? 0);
  expect(positions.actions?.y).toBe(positions.summary?.y);

  const widths = await page.getByRole("list", { name: "Product results" }).evaluate((list) => {
    const workspace = list.closest('[aria-label="Product workspace"]');
    const articles = [...list.querySelectorAll("article")];
    const firstArticle = articles[0];
    const summary = firstArticle?.querySelector('[data-slot="product-ledger-summary"]');
    const box = (element: Element | null | undefined) => element?.getBoundingClientRect();

    return {
      articleWidths: articles.map((element) => element.getBoundingClientRect().width),
      columns: firstArticle ? getComputedStyle(firstArticle).gridTemplateColumns : "",
      list: list.getBoundingClientRect(),
      summary: box(summary),
      workspace: box(workspace),
    };
  });

  expect(Math.abs(widths.list.width - (widths.workspace?.width ?? 0))).toBeLessThan(1);
  expect(widths.list.width).toBeGreaterThan(0);
  expect(widths.columns.split(" ")).toHaveLength(2);
  for (const articleWidth of widths.articleWidths) {
    expect(Math.abs(articleWidth - widths.list.width)).toBeLessThan(1);
  }
  expect((widths.summary?.width ?? 0) / widths.list.width).toBeGreaterThan(0.55);
  expect((widths.summary?.width ?? 0) / widths.list.width).toBeLessThan(0.8);
}

export async function expectMobileLedgerDecisionContext(page: Page) {
  await expect(page.locator('[data-slot="home-ledger-headings"]')).toHaveCount(0);
  const article = page.getByRole("article", { name: products[0].name });

  await expect(article.locator('[data-slot="product-ledger-highlights"]')).toBeVisible();
  await expect(article.locator('[data-slot="product-ledger-price-signal"]')).toBeVisible();
  await expect(article.locator('[data-slot="product-ledger-freshness"]')).toBeVisible();
  await expect(article.locator('[data-slot="product-ledger-offer"]')).toBeVisible();
  await expect(article.locator('[data-slot="product-ledger-actions"]')).toBeVisible();
  await expect(article.getByRole("button", { name: "More details" })).toHaveCount(0);
  await expect(article.locator('[data-slot="product-ledger-summary"]')).toContainText(
    "Capacity: 1.0 L · Temperature range: 40–100 °C · Warranty: 2 years",
  );
  await expect(article.locator('[data-slot="product-ledger-market"]')).toContainText(
    "Below the 30-day price",
  );
  await expect(article.locator('[data-slot="product-ledger-market"]')).toContainText(
    "Last checked 2 days ago",
  );
}
