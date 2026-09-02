import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import {
  expectNoUnhandledGraphQLOperations,
  homeResponders,
  memberViewer,
  products,
  stubGraphQL,
  VIEWPORTS,
} from "./production-ui-home-fixture";

const comparisonPath = "/compare?slug=brewmaster-precision-kettle&slug=northstar-barista-scale";

test.afterEach(({ page }) => {
  expectNoUnhandledGraphQLOperations(page);
});

for (const viewport of VIEWPORTS) {
  test(`${viewport.name} comparison workspace stays ordered, accessible, and within the viewport`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({
      height: viewport.height,
      width: viewport.width,
    });
    const responders = comparisonResponders();
    await stubGraphQL(page, responders);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openComparisonFromHome(page);

    const workspace = page.getByRole("region", {
      name: "Comparison workspace",
    });
    const controls = page.getByRole("region", { name: "Comparison controls" });
    const summaries = page.getByRole("region", {
      name: "Product decision summaries",
    });
    const specificationWorkspace = page.getByRole("region", {
      name: "Specification comparison",
    });

    await expect(workspace).toBeVisible();
    await expect(controls).toContainText("Save, share, remove, or add products");
    await expect(summaries.getByRole("heading", { name: products[0].name })).toBeVisible();
    await expect(summaries.getByText("Northline Workshop").first()).toBeVisible();
    await expect(page.getByRole("tablist", { name: "Specification views" })).toBeVisible();
    await expect(page.getByRole("table", { name: "Shared specifications" })).toBeVisible();

    const tabsBeforeMatrix = await specificationWorkspace.evaluate((element) => {
      const tabs = element.querySelector('[role="tablist"]');
      const matrix = element.querySelector("table");
      return Boolean(
        tabs && matrix && tabs.compareDocumentPosition(matrix) & Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });
    expect(tabsBeforeMatrix).toBe(true);

    await page.getByRole("tab", { name: "Differences" }).click();
    await expect(page).toHaveURL(/specs=differences$/);
    await expect(page.getByRole("heading", { name: "Different specifications" })).toBeVisible();
    await page.getByRole("tab", { name: "Shared specs" }).click();

    await page.getByRole("button", { name: "Share this comparison" }).click();
    await expect(page.getByRole("button", { name: "Publish comparison link" })).toBeVisible();
    await expect(
      page.getByRole("link", {
        name: `Remove ${products[0].name} from selection`,
      }),
    ).toHaveAttribute("href", "/compare?slug=northstar-barista-scale");

    const tableBounds = await page.locator('[data-slot="table-container"]').evaluateAll((tables) =>
      tables.map((table) => {
        const parent = table.parentElement;

        if (!parent) throw new Error("Expected every table container to have a parent.");

        return {
          containerRight: table.getBoundingClientRect().right,
          parentRight: parent.getBoundingClientRect().right,
        };
      }),
    );
    expect(tableBounds.length).toBeGreaterThan(0);
    for (const bounds of tableBounds) {
      expect(bounds.containerRight).toBeLessThanOrEqual(bounds.parentRight + 1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      viewport.width,
    );
    const accessibility = await new AxeBuilder({ page }).analyze();
    expect(accessibility.violations).toEqual([]);
    await page.screenshot({
      path: testInfo.outputPath(`${viewport.name}-comparison.png`),
    });
  });
}

test("guest comparison intent returns through registration for review before saving", async ({
  page,
}) => {
  let authenticated = false;
  const responders = comparisonResponders();
  responders.set("RootRouteQuery", () => ({
    data: { viewer: authenticated ? memberViewer("comparison-member") : null },
  }));
  responders.set("RegisterRouteMutation", () => {
    authenticated = true;
    return {
      data: {
        register: {
          viewer: memberViewer("comparison-member"),
          errors: [],
        },
      },
    };
  });
  responders.set("CompareRouteCreateSavedComparisonSetMutation", {
    data: {
      createSavedComparisonSet: {
        savedComparisonSet: { id: "saved-comparison-1" },
        errors: [],
      },
    },
  });
  const requests = await stubGraphQL(page, responders);

  await openComparisonFromHome(page);
  const saveComparison = page.getByRole("button", { name: "Save comparison" });
  await saveComparison.click();

  const dialog = page.getByRole("dialog", {
    name: "Sign in to save this comparison",
  });
  await expect(dialog).toBeVisible();
  expect(
    requests.some(
      ({ operationName }) => operationName === "CompareRouteCreateSavedComparisonSetMutation",
    ),
  ).toBe(false);

  await dialog.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(
    /\/auth\/register\?returnTo=%2Fcompare%3Fslug%3Dbrewmaster-precision-kettle%26slug%3Dnorthstar-barista-scale&intent=save_comparison$/,
  );
  await page.getByLabel("Email").fill("comparison-member@example.test");
  await page.getByLabel("Password").fill("comparison-member-password");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(comparisonPath);
  await expect(page.getByRole("status", { name: "Save comparison status" })).toContainText(
    "Your comparison draft was restored",
  );
  expect(
    requests.some(
      ({ operationName }) => operationName === "CompareRouteCreateSavedComparisonSetMutation",
    ),
  ).toBe(false);

  await page.getByRole("button", { name: "Save comparison" }).click();
  await expect(page.getByRole("status", { name: "Save comparison status" })).toContainText(
    "Comparison saved.",
  );
  expect(requests).toContainEqual({
    operationName: "CompareRouteCreateSavedComparisonSetMutation",
    variables: {
      input: {
        name: `${products[0].name} vs ${products[1].name}`,
        productIds: ["product-1-compare", "product-2-compare"],
      },
    },
  });
});

function comparisonResponders() {
  const responders = homeResponders();
  responders.set("RecommendationPanelQuery", {
    data: {
      comparisonRecommendation: {
        winnerProductId: "product-1-compare",
        missingInputs: [],
        rankings: [
          {
            productId: "product-1-compare",
            productName: products[0].name,
            claimIds: [],
            reasons: ["Lowest current supported price"],
          },
          {
            productId: "product-2-compare",
            productName: products[1].name,
            claimIds: [],
            reasons: ["Strong alternative"],
          },
        ],
      },
    },
  });
  responders.set("ComparisonSharingOperationsQuery", {
    data: {
      viewer: {
        comparisonSnapshots: {
          edges: [],
          pageInfo: { endCursor: null, hasNextPage: false },
        },
      },
    },
  });
  return responders;
}

async function openComparisonFromHome(page: Page) {
  await page.goto(`/?${comparisonPath.split("?")[1]}`);
  await page.getByRole("link", { name: "Open comparison" }).first().click();
  await expect(page).toHaveURL(comparisonPath);
}
