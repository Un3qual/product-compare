import {
  homeDealReasonCopy,
  homeDealViewData,
  homeDealsViewData,
  homeLedgerRows,
  homeWorkspaceViewData,
} from "../../../src/routes/home/home-view-data";

test("home workspace maps category nodes and keeps all connection-owned ledger rows", () => {
  const viewData = homeWorkspaceViewData({
    categories: {
      edges: [
        {
          node: {
            id: "category-cameras",
            name: "Cameras",
            slug: "cameras",
            description: "Mirrorless and compact cameras.",
          },
        },
      ],
    },
    products: { edges: [] },
    selectedProducts: [{ id: "product-1", name: "Model 1", slug: "model-1" }],
  } as never);
  const rows = homeLedgerRows(
    {
      edges: Array.from({ length: 7 }, (_, index) => ({
        node: {
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
    } as never,
    ["model-1"],
  );

  expect(rows).toHaveLength(7);
  expect(rows[0]).toMatchObject({
    highlights: "Sensor: 24 MP",
    offer: "$499.95 at Camera Shop",
    priceSignal: "Below the 30-day price",
  });
  expect(rows[1]).toMatchObject({
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

  const deal = {
    node: { id: "product-1", name: "Model 1", slug: "model-1" },
    offer: {
      merchantName: "Camera Shop",
      currency: "USD",
      landedPrice: "399.00",
      observedAt: "2026-08-10T12:00:00Z",
    },
    reasons: [{ code: "WATCH_TARGET", watchTarget: "450.00" }],
  };
  const deals = homeDealsViewData(
    {
      new: { edges: [] },
      trending: { edges: [] },
      forYou: { edges: [{ cursor: "cursor-1", ...deal }] },
    } as never,
    true,
  );

  expect(deals.tabs.map((tab) => tab.label)).toEqual(["New", "Trending", "For you"]);
  expect(homeDealViewData(deal as never, ["model-1"])).toMatchObject({
    reason: "Matches your $450.00 price watch",
  });
});

test("home prices preserve exact decimal values beyond JavaScript's safe integer range", () => {
  expect(
    homeDealReasonCopy({ code: "WATCH_TARGET", watchTarget: "9007199254740993.01" }, "USD"),
  ).toBe("Matches your $9,007,199,254,740,993.01 price watch");

  const rows = homeLedgerRows(
    {
      edges: [
        {
          node: { id: "large-price", name: "Large price", slug: "large-price" },
          highlights: [],
          offer: {
            merchantName: "Exact Shop",
            currency: "USD",
            landedPrice: "9007199254740993.01",
            priceSignal: "BELOW_30_DAY_MEDIAN",
            observedAt: "2026-08-10T12:00:00Z",
          },
        },
      ],
    } as never,
    [],
  );

  expect(rows[0]?.offer).toBe("$9,007,199,254,740,993.01 at Exact Shop");
});

test("home workspace treats a future price signal as unavailable history", () => {
  const rows = homeLedgerRows(
    {
      edges: [
        {
          node: {
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
    } as never,
    [],
  );

  expect(rows[0]?.priceSignal).toBe("No 30-day price history");
});

test("home deals omit the personal tab for guests and name empty states", () => {
  const deals = homeDealsViewData(
    {
      new: { edges: [] },
      trending: { edges: [] },
      forYou: { edges: [] },
    } as never,
    false,
  );

  expect(deals.tabs.map((tab) => tab.label)).toEqual(["New", "Trending"]);
  expect(deals.tabs[0]).toMatchObject({ emptyTitle: "No new offers to show yet." });
  expect(deals.tabs[1]).toMatchObject({ emptyTitle: "No trending offers to show yet." });
});
