import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  expectNoUnhandledGraphQLOperations,
  homeResponders,
  stubGraphQL,
  VIEWPORTS,
} from "./production-ui-home-fixture";

test.afterEach(({ page }) => {
  expectNoUnhandledGraphQLOperations(page);
});

for (const viewport of VIEWPORTS) {
  test(`${viewport.name} operator workspaces stay ordered, accessible, and within the viewport`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ height: viewport.height, width: viewport.width });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await stubGraphQL(page, operatorResponders());

    await page.goto("/affiliate/setup");
    await expect(page.getByRole("heading", { name: "Affiliate setup" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "1. Network" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "2. Program" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "3. Merchant link" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "4. Coupon" })).toBeVisible();
    await expect(
      page.getByText("Current merchant: Northwind Supply (northwind.example)"),
    ).toBeVisible();
    await expectOperatorSurface(page, viewport.width);
    await captureOperatorWorkspace(
      page,
      testInfo.outputPath(`${viewport.name}-affiliate-workflow.png`),
    );

    await page.goto("/ingestion/cj-programs");
    const cjLedger = page.getByRole("table", { name: "CJ program lifecycle ledger" });
    await expect(cjLedger).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Action" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Unmatched feeds" })).toBeVisible();
    await expect(page.locator('time[datetime="2026-08-12T17:45:00Z"]')).toBeVisible();
    await expect(cjLedger.getByText("ID northwind-advertiser")).toBeVisible();
    await expect(cjLedger.getByText("1 feed")).toBeVisible();
    await expect(cjLedger.locator("h1, h2, h3, h4, h5, h6")).toHaveCount(0);
    await page.getByRole("button", { name: "Edit program Northwind Merchant" }).click();
    const programEditor = page.getByRole("region", { name: "Edit Northwind Merchant" });
    await expect(programEditor.getByLabel("Stage for Northwind Merchant")).toBeVisible();
    await expect(programEditor.getByLabel("Note for Northwind Merchant")).toBeVisible();
    await expect(
      programEditor.getByRole("button", { name: "Save Northwind Merchant" }),
    ).toBeVisible();
    await expect(
      programEditor.getByRole("button", { name: "Show feeds for Northwind Merchant" }),
    ).toBeVisible();
    if (viewport.name === "desktop") {
      await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath("desktop-cj-editor.png"),
      });
    }
    await page.getByRole("button", { name: "Close editor Northwind Merchant" }).click();
    await expectTableContained(cjLedger, { compact: viewport.name !== "mobile" });
    await expectOperatorSurface(page, viewport.width);
    await captureOperatorWorkspace(page, testInfo.outputPath(`${viewport.name}-cj-lifecycle.png`));

    await page.goto("/commerce/revenue?currency=USD&network=impact");
    const controls = page.getByRole("region", { name: "Revenue controls" });
    const summary = page.getByRole("region", { name: "Summary" });
    const ledger = page.getByRole("table", { name: "Attribution ledger" });
    await expect(controls).toBeVisible();
    await expect(summary).toBeVisible();
    await expect(ledger).toBeVisible();
    await expectTableContained(ledger, { compact: viewport.name !== "mobile" });
    expect(
      await controls.evaluate(
        (element, nextElement) =>
          Boolean(
            nextElement &&
            element.compareDocumentPosition(nextElement) & Node.DOCUMENT_POSITION_FOLLOWING,
          ),
        await summary.elementHandle(),
      ),
    ).toBe(true);
    const conversion = ledger.getByRole("group", {
      name: "Conversion impact-conversion-123",
    });
    await expect(conversion.getByText("Order value")).toBeVisible();
    await expect(conversion.getByText("Commission")).toBeVisible();
    await expect(conversion.getByText("180.00 USD")).toBeVisible();
    await expect(conversion.getByText("18.00 USD")).toBeVisible();
    await expect(conversion.getByText("Northwind Supply")).toBeVisible();
    await expect(conversion.getByText("Field Camera")).toBeVisible();
    await expect(conversion.getByText("Impact", { exact: true })).toBeVisible();
    await expect(conversion.locator('time[datetime="2026-08-12T18:00:00Z"]')).toBeVisible();
    await expect(conversion.locator('time[datetime="2026-08-13T09:15:00Z"]')).toBeVisible();
    await expect(ledger.locator("h1, h2, h3, h4, h5, h6")).toHaveCount(0);
    await expectOperatorSurface(page, viewport.width);
    await captureOperatorWorkspace(
      page,
      testInfo.outputPath(`${viewport.name}-revenue-ledger.png`),
    );
  });
}

async function expectTableContained(table: Locator, options: { compact: boolean }) {
  const bounds = await table.evaluate((element) => {
    const container = element.closest<HTMLElement>('[data-slot="table-container"]');
    const parent = container?.parentElement;

    if (!container || !parent) {
      throw new Error("Expected a table container and parent.");
    }

    return {
      clientWidth: container.clientWidth,
      containerRight: container.getBoundingClientRect().right,
      parentRight: parent.getBoundingClientRect().right,
      scrollWidth: container.scrollWidth,
    };
  });

  expect(bounds.containerRight).toBeLessThanOrEqual(bounds.parentRight + 1);

  if (options.compact) {
    expect(bounds.scrollWidth).toBeLessThanOrEqual(bounds.clientWidth + 1);
  }
}

async function captureOperatorWorkspace(page: Page, path: string) {
  await page.evaluate(() => {
    document.querySelector("nav")?.setAttribute("style", "position: static !important");
    document
      .querySelectorAll("aside")
      .forEach((aside) => aside.setAttribute("style", "position: static !important"));
    document.querySelectorAll<HTMLElement>('[data-slot="table-container"]').forEach((container) => {
      container.scrollLeft = 0;
    });
    window.scrollTo(0, 0);
  });

  await page.screenshot({ fullPage: true, path });
}

test("affiliate mutations keep errors local and carry typed context through every step", async ({
  page,
}) => {
  let linkAttempts = 0;
  const responders = operatorResponders();
  responders.set("AffiliateSetupOperationsUpsertAffiliateLinkMutation", () => {
    linkAttempts += 1;

    return linkAttempts === 1
      ? {
          data: {
            upsertAffiliateLink: {
              link: null,
              errors: [
                {
                  code: "INVALID_ARGUMENT",
                  field: "affiliateUrl",
                  message: "Affiliate URL could not be verified.",
                },
              ],
            },
          },
        }
      : { data: { upsertAffiliateLink: affiliateLinkPayload() } };
  });
  const requests = await stubGraphQL(page, responders);

  await page.goto("/affiliate/setup");
  await page.getByLabel("Network name").fill("Impact Network");
  await page.getByRole("button", { name: "Save network" }).click();
  await expect(page.getByRole("region", { name: "Affiliate network result" })).toContainText(
    "network-impact",
  );
  await expect(
    page.getByRole("textbox", { name: "Affiliate network ID", exact: true }),
  ).toHaveValue("network-impact");

  await page.getByLabel("Program code").fill("northwind-impact");
  await page.getByLabel("Program status").fill("ACTIVE");
  await page.getByRole("button", { name: "Save program" }).click();
  await expect(page.getByRole("region", { name: "Affiliate program result" })).toContainText(
    "program-impact",
  );

  await page.getByLabel("Merchant product ID").fill("merchant-product-northwind");
  await page.getByLabel("Link affiliate network ID").fill("network-impact");
  await page.getByLabel("Original URL").fill("https://northwind.example/field-camera");
  await page.getByLabel("Affiliate URL").fill("https://impact.example/track/field-camera");
  await page.getByRole("button", { name: "Save link" }).click();
  await expect(page.getByRole("alert")).toContainText("Affiliate URL could not be verified.");
  await expect(page.getByRole("heading", { name: "4. Coupon" })).toBeVisible();
  await page.getByRole("button", { name: "Save link" }).click();
  await expect(page.getByRole("region", { name: "Affiliate link result" })).toContainText(
    "link-impact",
  );

  await page.getByLabel("Coupon code").fill("FIELD20");
  await page.getByLabel("Discount value").fill("20");
  await page.getByLabel("Currency").fill("usd");
  await page.getByRole("button", { name: "Create coupon" }).click();
  await expect(page.getByRole("region", { name: "Coupon result" })).toContainText("FIELD20");

  expect(requests.map(({ operationName }) => operationName)).toEqual(
    expect.arrayContaining([
      "AffiliateSetupOperationsUpsertAffiliateNetworkMutation",
      "AffiliateSetupOperationsUpsertAffiliateProgramMutation",
      "AffiliateSetupOperationsUpsertAffiliateLinkMutation",
      "AffiliateSetupOperationsCreateCouponMutation",
    ]),
  );
});

test("CJ feed failures stay local and lifecycle updates remain usable", async ({ page }) => {
  let feedAttempts = 0;
  const responders = operatorResponders();
  responders.set("ProgramFeedsQuery", () => {
    feedAttempts += 1;

    return feedAttempts === 1
      ? { errors: [{ message: "Program feeds unavailable" }] }
      : { data: programFeedsData() };
  });
  await stubGraphQL(page, responders);

  await page.goto("/ingestion/cj-programs");
  await page.getByRole("button", { name: "Edit program Northwind Merchant" }).click();
  const editor = page.getByRole("region", { name: "Edit Northwind Merchant" });
  await editor.getByRole("button", { name: "Show feeds for Northwind Merchant" }).click();
  await expect(editor.getByRole("alert")).toContainText("Feeds unavailable.");
  await expect(page.getByRole("table", { name: "CJ program lifecycle ledger" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Unmatched feeds" })).toBeVisible();
  await editor.getByRole("button", { name: "Retry feeds for Northwind Merchant" }).click();
  await expect(editor.getByRole("list", { name: "Feeds for Northwind Merchant" })).toContainText(
    "Northwind Product Feed",
  );

  const stage = editor.getByRole("combobox", { name: "Stage for Northwind Merchant" });
  await stage.click();
  await page.getByRole("option", { name: "Accepted" }).click();
  await editor.getByRole("button", { name: "Save Northwind Merchant" }).click();
  await expect(editor.getByRole("status")).toContainText("Northwind Merchant saved.");
});

test("an unmatched-feed failure does not hide the CJ lifecycle ledger", async ({ page }) => {
  const responders = operatorResponders();
  responders.set("UnmatchedFeedsQuery", {
    errors: [{ message: "Unmatched feeds unavailable" }],
  });
  await stubGraphQL(page, responders);

  await page.goto("/ingestion/cj-programs");

  await expect(page.getByRole("table", { name: "CJ program lifecycle ledger" })).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("Unmatched feeds unavailable.");
  await page.getByRole("button", { name: "Edit program Northwind Merchant" }).click();
  await expect(
    page
      .getByRole("region", { name: "Edit Northwind Merchant" })
      .getByLabel("Stage for Northwind Merchant"),
  ).toBeEnabled();
});

test("revenue summary, ledger preload, and pagination failures recover independently", async ({
  page,
}) => {
  let failSummary = true;
  let failLedger = false;
  let paginationAttempts = 0;
  const responders = operatorResponders();
  responders.set("RevenueSummaryRouteQuery", () =>
    failSummary
      ? { errors: [{ message: "Revenue summary unavailable" }] }
      : { data: revenueSummaryData() },
  );
  responders.set("AttributionLedgerRouteQuery", () =>
    failLedger
      ? { errors: [{ message: "Attribution ledger unavailable" }] }
      : { data: attributionLedgerData() },
  );
  responders.set("AttributionLedgerPaginationQuery", () => {
    paginationAttempts += 1;

    return paginationAttempts === 1
      ? { errors: [{ message: "Next attribution page unavailable" }] }
      : { data: emptyAttributionLedgerData() };
  });
  await stubGraphQL(page, responders);

  await page.goto("/commerce/revenue?currency=USD");
  await expect(page.getByText("Revenue summary unavailable.")).toBeVisible();
  await expect(page.getByRole("table", { name: "Attribution ledger" })).toBeVisible();

  failSummary = false;
  failLedger = true;
  await page.reload();
  await expect(page.getByRole("region", { name: "Summary" })).toBeVisible();
  await expect(page.getByText("Attribution ledger unavailable.")).toBeVisible();

  failLedger = false;
  await page.reload();
  await page.getByRole("button", { name: "Load more attribution clicks" }).click();
  await expect(page.getByRole("alert")).toContainText("Unable to load more attribution clicks.");
  await expect(page.getByText("operator@example.test").first()).toBeVisible();
  await page.getByRole("button", { name: "Retry loading attribution clicks" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByText("operator@example.test").first()).toBeVisible();
});

async function expectOperatorSurface(page: Page, viewportWidth: number) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    viewportWidth,
  );
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
}

function operatorResponders() {
  const responders = homeResponders({
    viewer: { email: "operator@example.test", id: "operator-1", isOperator: true },
  });
  responders.set("AffiliateSetupRouteQuery", { data: affiliateSetupData() });
  responders.set("AffiliateSetupOperationsUpsertAffiliateNetworkMutation", {
    data: {
      upsertAffiliateNetwork: {
        network: { id: "network-impact", name: "Impact Network" },
        errors: [],
      },
    },
  });
  responders.set("AffiliateSetupOperationsUpsertAffiliateProgramMutation", {
    data: {
      upsertAffiliateProgram: {
        program: {
          id: "program-impact",
          affiliateNetworkId: "network-impact",
          merchantId: "merchant-northwind",
          programCode: "northwind-impact",
          status: "ACTIVE",
        },
        errors: [],
      },
    },
  });
  responders.set("AffiliateSetupOperationsUpsertAffiliateLinkMutation", {
    data: { upsertAffiliateLink: affiliateLinkPayload() },
  });
  responders.set("AffiliateSetupOperationsCreateCouponMutation", {
    data: {
      createCoupon: {
        coupon: {
          id: "coupon-field20",
          merchantId: "merchant-northwind",
          affiliateNetworkId: "network-impact",
          code: "FIELD20",
          discountType: "OTHER",
          discountValue: "20",
          currency: "USD",
          validFrom: null,
          validTo: null,
        },
        errors: [],
      },
    },
  });
  responders.set("CJProgramsRouteQuery", { data: cjProgramsData() });
  responders.set("UnmatchedFeedsQuery", { data: unmatchedFeedsData() });
  responders.set("ProgramFeedsQuery", { data: programFeedsData() });
  responders.set("ProgramLifecycleRowUpdateCJProgramMutation", {
    data: { updateCjProgram: { errors: [] } },
  });
  responders.set("RevenueSummaryRouteQuery", { data: revenueSummaryData() });
  responders.set("AttributionLedgerRouteQuery", { data: attributionLedgerData() });
  responders.set("AttributionLedgerPaginationQuery", { data: emptyAttributionLedgerData() });

  return responders;
}

function affiliateSetupData() {
  return {
    merchants: {
      edges: [
        {
          cursor: "merchant-cursor-1",
          node: {
            id: "merchant-northwind",
            name: "Northwind Supply",
            domain: "northwind.example",
            slug: "northwind-supply",
          },
        },
      ],
      pageInfo: {
        endCursor: "merchant-cursor-1",
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: "merchant-cursor-1",
      },
    },
  };
}

function affiliateLinkPayload() {
  return {
    link: {
      id: "link-impact",
      merchantProductId: "merchant-product-northwind",
      affiliateNetworkId: "network-impact",
      originalUrl: "https://northwind.example/field-camera",
      affiliateUrl: "https://impact.example/track/field-camera",
      lastVerifiedAt: null,
    },
    errors: [],
  };
}

function cjProgramsData() {
  return {
    cjProgramStageCounts: {
      new: 1,
      considering: 0,
      selected: 0,
      applied: 0,
      accepted: 0,
      notPursuing: 0,
      declined: 0,
    },
    cjPrograms: {
      edges: [
        {
          node: {
            id: "cj-program-northwind",
            advertiserId: "northwind-advertiser",
            advertiserName: "Northwind Merchant",
            stage: "NEW",
            note: null,
            lastChanged: "2026-08-12T17:45:00Z",
            feedCount: 1,
            warningCodes: [],
          },
        },
      ],
      pageInfo: { endCursor: "program-cursor-1", hasNextPage: false, hasPreviousPage: false },
    },
  };
}

function unmatchedFeedsData() {
  return {
    unmatchedCjFeeds: {
      edges: [
        {
          node: {
            id: "unmatched-feed-1",
            providerFeedId: "unmatched-northwind",
            advertiserName: "Unmatched Northwind",
            advertiserCountry: "US",
            sourceFeedType: "PRODUCT",
            currency: "USD",
            language: "EN",
            feedName: "Unmatched Northwind Feed",
            productCount: 25,
            lastSeenAt: "2026-08-12T17:30:00Z",
          },
        },
      ],
      pageInfo: { endCursor: "unmatched-cursor-1", hasNextPage: false, hasPreviousPage: false },
    },
  };
}

function programFeedsData() {
  return {
    cjProgram: {
      id: "cj-program-northwind",
      feeds: {
        edges: [
          {
            node: {
              id: "feed-northwind-1",
              providerFeedId: "northwind-products",
              advertiserName: "Northwind Merchant",
              advertiserCountry: "US",
              sourceFeedType: "PRODUCT",
              currency: "USD",
              language: "EN",
              feedName: "Northwind Product Feed",
              productCount: 500,
              lastSeenAt: "2026-08-12T17:40:00Z",
            },
          },
        ],
        pageInfo: { endCursor: "feed-cursor-1", hasNextPage: false, hasPreviousPage: false },
      },
    },
  };
}

function revenueSummaryData() {
  return {
    revenueSummary: {
      filters: {
        currency: "USD",
        from: null,
        merchantId: null,
        network: "impact",
        productId: null,
        to: null,
      },
      metrics: {
        averagePaidPrice: "180.00",
        clicks: 8,
        commissionRevenue: "18.00",
        conversions: 1,
        currency: "USD",
        grossOrderValue: "180.00",
      },
    },
  };
}

function attributionLedgerData(hasNextPage = true) {
  return {
    commerceAttributionClicks: {
      edges: [
        {
          cursor: "click-cursor-1",
          node: {
            __typename: "CommerceAttributionClick",
            affiliateNetworkCode: "impact",
            affiliateNetworkName: "Impact",
            affiliateProgramCode: "northwind-impact",
            anonymousVisitor: false,
            clickId: "click-northwind-1",
            insertedAt: "2026-08-12T17:50:00Z",
            ipAddress: "203.0.113.10",
            linkType: "AFFILIATE",
            matchedConversions: [
              {
                affiliateNetworkCode: "impact",
                affiliateNetworkName: "Impact",
                attributionConfidence: "HIGH",
                commissionAmount: "18.00",
                currency: "USD",
                merchantName: "Northwind Supply",
                networkConversionRef: "impact-conversion-123",
                orderAmount: "180.00",
                productName: "Field Camera",
                purchasedAt: "2026-08-12T18:00:00Z",
                reportedAt: "2026-08-13T09:15:00Z",
                status: "PAID",
              },
            ],
            merchantName: "Northwind Supply",
            merchantProductExternalSku: "FIELD-CAMERA-1",
            productName: "Field Camera",
            referrer: "https://productcompare.example/compare",
            sourceSurface: "WEB",
            userAgent: "OperatorBrowser/1.0",
            userEmail: "operator@example.test",
          },
        },
      ],
      pageInfo: { endCursor: "click-cursor-1", hasNextPage },
    },
  };
}

function emptyAttributionLedgerData() {
  return {
    commerceAttributionClicks: {
      edges: [],
      pageInfo: { endCursor: null, hasNextPage: false },
    },
  };
}
