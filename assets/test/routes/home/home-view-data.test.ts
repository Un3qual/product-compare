import {
  homeDealReasonCopy,
  homeDealsViewData,
  homeWorkspaceViewData,
} from "../../../src/routes/home/home-view-data";

test("home workspace keeps six ledger rows, plain price states, and category catalog entry", () => {
  const viewData = homeWorkspaceViewData(
    {
      categories: [
        {
          taxonId: "category-cameras",
          name: "Cameras",
          slug: "cameras",
          description: "Mirrorless and compact cameras.",
        },
      ],
      products: Array.from({ length: 7 }, (_, index) => ({
        product: {
          id: `product-${index + 1}`,
          name: `Model ${index + 1}`,
          slug: `model-${index + 1}`,
        },
        highlights: index === 0 ? [{ label: "Sensor", value: "24 MP" }] : [],
        offer:
          index === 0
            ? {
                merchantName: "Camera Shop",
                currency: "USD",
                landedPrice: "499.95",
                priceSignal: "BELOW_30_DAY_MEDIAN",
                observedAt: "2026-08-10T12:00:00Z",
              }
            : {
                merchantName: "Another Camera Shop",
                currency: "USD",
                landedPrice: "599.00",
                priceSignal: "NO_30_DAY_BASELINE",
                observedAt: "2026-08-10T12:00:00Z",
              },
      })),
      selectedProducts: [{ id: "product-1", name: "Model 1", slug: "model-1" }],
    },
    ["model-1"],
  );

  expect(viewData.ledgerRows).toHaveLength(6);
  expect(viewData.ledgerRows[0]).toMatchObject({
    highlights: "Sensor: 24 MP",
    offer: "$499.95 at Camera Shop",
    priceSignal: "Below the 30-day price",
  });
  expect(viewData.ledgerRows[1]).toMatchObject({
    highlights: "Details available on the product page",
    offer: "$599.00 at Another Camera Shop",
    priceSignal: "No 30-day price history",
  });
  expect(viewData.categories[0]).toMatchObject({
    href: "/products?first=12&typeTaxonId=category-cameras&includeTypeDescendants=1&slug=model-1",
    label: "Cameras",
  });
});

test("home deal copy only maps typed reasons and does not invent ranking explanations", () => {
  expect(homeDealReasonCopy({ code: "WATCH_TARGET", watchTarget: "450.00" }, "USD")).toBe(
    "Matches your $450.00 price watch",
  );
  expect(homeDealReasonCopy({ code: "CURRENT_COMPARISON", watchTarget: null }, "USD")).toBe(
    "In your current comparison",
  );
  expect(homeDealReasonCopy({ code: "WATCH_TARGET", watchTarget: null }, "USD")).toBe(
    "Matches your price watch",
  );
  expect(homeDealReasonCopy({ code: "%future added value", watchTarget: null }, "USD")).toBe(
    "Current offer",
  );

  const deals = homeDealsViewData(
    {
      new: [],
      trending: [],
      forYou: [
        {
          product: { id: "product-1", name: "Model 1", slug: "model-1" },
          offer: {
            merchantName: "Camera Shop",
            currency: "USD",
            landedPrice: "399.00",
            observedAt: "2026-08-10T12:00:00Z",
          },
          reasons: [{ code: "WATCH_TARGET", watchTarget: "450.00" }],
        },
      ],
    },
    true,
    ["model-1"],
  );

  expect(deals.tabs.map((tab) => tab.label)).toEqual(["New", "Trending", "For you"]);
  expect(deals.tabs[2]?.deals[0]).toMatchObject({ reason: "Matches your $450.00 price watch" });
});

test("home workspace treats a future price signal as unavailable history", () => {
  const viewData = homeWorkspaceViewData(
    {
      categories: [],
      products: [
        {
          product: {
            id: "future-price-signal",
            name: "Future signal product",
            slug: "future-signal-product",
          },
          highlights: [],
          offer: {
            merchantName: "Camera Shop",
            currency: "USD",
            landedPrice: "399.00",
            priceSignal: "%future added value",
            observedAt: "2026-08-10T12:00:00Z",
          },
        },
      ],
      selectedProducts: [],
    },
    [],
  );

  expect(viewData.ledgerRows[0]?.priceSignal).toBe("No 30-day price history");
});

test("home deals omit the personal tab for guests and empty states name the active shopping scope", () => {
  const deals = homeDealsViewData({ new: [], trending: [], forYou: [] }, false, []);

  expect(deals.tabs.map((tab) => tab.label)).toEqual(["New", "Trending"]);
  expect(deals.tabs[0]).toMatchObject({ emptyTitle: "No new offers to show yet." });
  expect(deals.tabs[1]).toMatchObject({ emptyTitle: "No trending offers to show yet." });
});
