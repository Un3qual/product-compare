import {
  getMerchantDetailViewData,
  type MerchantDetailViewDataInput,
} from "../../../src/routes/merchants/detail/merchant-detail-view-data";

test("derives merchant coverage rows and observed freshness copy in the rendered order", () => {
  const data = getMerchantDetailViewData(
    buildMerchant({
      detailSummary: buildSummary({
        activeOfferCount: 8,
        distinctProductCount: 5,
        eligibleOfferCount: 3,
        freshOfferCount: 2,
        agingOfferCount: 1,
        staleOfferCount: 2,
        unobservedOfferCount: 3,
        lastObservedAt: "2026-07-14T01:00:00Z",
      }),
    }),
  );

  expect(data.summaryItems).toEqual([
    { label: "Active offers", value: 8 },
    { label: "Products", value: 5 },
    { label: "Offers with complete prices", value: 3 },
    { label: "Recently checked offers", value: 2 },
  ]);
  expect(data.observation).toEqual({
    freshnessCopy: "1 need a refresh, 2 are out of date, and 3 have not been checked.",
    lastObservedAt: "2026-07-14T01:00:00Z",
    leadCopy: "Prices last checked",
  });
});

test("keeps the missing-observation fallback while retaining freshness counts", () => {
  const data = getMerchantDetailViewData(
    buildMerchant({
      detailSummary: buildSummary({
        lastObservedAt: null,
        agingOfferCount: 0,
        staleOfferCount: 4,
        unobservedOfferCount: 2,
      }),
    }),
  );

  expect(data.observation).toEqual({
    freshnessCopy: "0 need a refresh, 4 are out of date, and 2 have not been checked.",
    lastObservedAt: null,
    leadCopy: "No offer prices have been checked yet.",
  });
});

test("treats undefined Relay nullable fields like their null fallbacks", () => {
  const data = getMerchantDetailViewData(
    buildMerchant({
      detailSummary: buildSummary({ lastObservedAt: undefined }),
      merchantProducts: buildProducts(
        [
          buildOffer({ id: "no-product-or-price", product: undefined, latestPrice: undefined }),
          buildOffer({
            id: "unknown-shipping",
            latestPrice: { price: "12", shipping: undefined, inStock: undefined },
          }),
        ],
        { hasNextPage: true, endCursor: undefined },
      ),
    }),
  );

  expect(data.observation).toMatchObject({
    lastObservedAt: null,
    leadCopy: "No offer prices have been checked yet.",
  });
  expect(data.offerRows).toEqual([
    { id: "no-product-or-price", product: null, priceCopy: "No current price available." },
    {
      id: "unknown-shipping",
      product: { name: "Field Camera", path: "/products/field-camera" },
      priceCopy: "12 USD plus unknown shipping · Stock unknown",
    },
  ]);
  expect(data.nextPagePath).toBeNull();
});

test("projects available and unavailable offers in source order with exact price fallbacks", () => {
  const data = getMerchantDetailViewData(
    buildMerchant({
      merchantProducts: buildProducts([
        buildOffer({
          id: "first",
          product: { name: "Unavailable source product", slug: "ignored" },
          latestPrice: null,
        }),
        buildOffer({
          id: "second",
          currency: "USD",
          product: null,
          latestPrice: { price: "12", shipping: null, inStock: false },
        }),
        buildOffer({
          id: "third",
          currency: "EUR",
          product: { name: "Cameras & lenses", slug: "cameras & lenses/?" },
          latestPrice: { price: "20", shipping: "5", inStock: undefined },
        }),
        buildOffer({
          id: "fourth",
          currency: "GBP",
          latestPrice: { price: "30", shipping: "0", inStock: true },
        }),
      ]),
    }),
  );

  expect(data.offerRows).toEqual([
    {
      id: "first",
      priceCopy: "No current price available.",
      product: { name: "Unavailable source product", path: "/products/ignored" },
    },
    {
      id: "second",
      priceCopy: "12 USD plus unknown shipping · Out of stock",
      product: null,
    },
    {
      id: "third",
      priceCopy: "20 EUR + 5 shipping · Stock unknown",
      product: { name: "Cameras & lenses", path: "/products/cameras%20%26%20lenses%2F%3F" },
    },
    {
      id: "fourth",
      priceCopy: "30 GBP + 0 shipping · In stock",
      product: { name: "Field Camera", path: "/products/field-camera" },
    },
  ]);
});

test("returns an encoded advancing offers path only when pagination is complete", () => {
  expect(
    getMerchantDetailViewData(
      buildMerchant({
        slug: "trusted shop/?",
        merchantProducts: buildProducts([], { hasNextPage: true, endCursor: "next + /?" }),
      }),
    ).nextPagePath,
  ).toBe("/merchants/trusted%20shop%2F%3F?after=next%20%2B%20%2F%3F");

  expect(
    getMerchantDetailViewData(
      buildMerchant({
        merchantProducts: buildProducts([], { hasNextPage: false, endCursor: "next" }),
      }),
    ).nextPagePath,
  ).toBeNull();
  expect(
    getMerchantDetailViewData(
      buildMerchant({
        merchantProducts: buildProducts([], { hasNextPage: true, endCursor: null }),
      }),
    ).nextPagePath,
  ).toBeNull();
  expect(
    getMerchantDetailViewData(
      buildMerchant({
        merchantProducts: buildProducts([], { hasNextPage: true, endCursor: "same" }),
      }),
      "same",
    ).nextPagePath,
  ).toBeNull();
  expect(
    getMerchantDetailViewData(
      buildMerchant({
        merchantProducts: buildProducts([], { hasNextPage: true, endCursor: "  " }),
      }),
    ).nextPagePath,
  ).toBeNull();
});

test("does not mutate merchant summaries, offer rows, or pagination", () => {
  const merchant = buildMerchant({
    merchantProducts: buildProducts([buildOffer({ product: { name: "Camera", slug: "camera" } })]),
  });
  const original = structuredClone(merchant);

  getMerchantDetailViewData(merchant);

  expect(merchant).toEqual(original);
});

function buildMerchant(
  overrides: Partial<MerchantDetailViewDataInput> = {},
): MerchantDetailViewDataInput {
  return {
    slug: "trusted-shop",
    detailSummary: buildSummary(),
    merchantProducts: buildProducts([buildOffer()]),
    ...overrides,
  };
}

function buildSummary(overrides: Partial<MerchantDetailViewDataInput["detailSummary"]> = {}) {
  return {
    activeOfferCount: 2,
    distinctProductCount: 1,
    eligibleOfferCount: 1,
    freshOfferCount: 1,
    agingOfferCount: 0,
    staleOfferCount: 0,
    unobservedOfferCount: 1,
    lastObservedAt: "2026-07-14T01:00:00Z",
    ...overrides,
  };
}

function buildProducts(
  nodes: MerchantDetailViewDataInput["merchantProducts"]["edges"][number]["node"][],
  pageInfo: MerchantDetailViewDataInput["merchantProducts"]["pageInfo"] = {
    hasNextPage: false,
    endCursor: null,
  },
): MerchantDetailViewDataInput["merchantProducts"] {
  return { edges: nodes.map((node) => ({ node })), pageInfo };
}

function buildOffer(
  overrides: Partial<MerchantDetailViewDataInput["merchantProducts"]["edges"][number]["node"]> = {},
): MerchantDetailViewDataInput["merchantProducts"]["edges"][number]["node"] {
  return {
    id: "offer-1",
    currency: "USD",
    product: { name: "Field Camera", slug: "field-camera" },
    latestPrice: { price: "99", shipping: "4", inStock: true },
    ...overrides,
  };
}
