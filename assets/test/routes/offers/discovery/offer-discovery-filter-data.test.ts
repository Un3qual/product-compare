import {
  buildOfferDiscoveryPaginationData,
  offerDiscoverySelectedProductContext,
  getOfferDiscoveryFilterData,
} from "../../../../src/routes/offers/discovery/offer-discovery-filter-data";

const DEFAULT_FILTERS = {
  activeOnly: true,
  after: null,
  compareSlugs: [] as string[],
  first: 6,
  merchantId: null,
  productId: null,
  sort: "default",
} as const;

test.each([
  [true, { label: "Active offers", tone: "positive" }],
  [false, { label: "All offers", tone: "neutral" }],
] as const)(
  "projects the %s offer-discovery scope badge without mutating filters",
  (activeOnly, scopeBadge) => {
    const filters = Object.freeze({ ...DEFAULT_FILTERS, activeOnly });

    expect(getOfferDiscoveryFilterData(filters).scopeBadge).toEqual(scopeBadge);
    expect(filters).toEqual({ ...DEFAULT_FILTERS, activeOnly });
  },
);

test.each([null, { __typename: "%other" as const }])(
  "returns no selected-product context for %j",
  (node) => {
    expect(offerDiscoverySelectedProductContext(node)).toBeNull();
  },
);

test("projects exact selected-product context and preserves brand identity", () => {
  const brand = Object.freeze({ id: "brand-1", name: "Example Brand" });
  const node = Object.freeze({
    __typename: "Product" as const,
    brand,
    id: "product-1",
    name: "Detail Product",
    slug: "detail-product",
  });

  const context = offerDiscoverySelectedProductContext(node);

  expect(context).toEqual({
    brand: { id: "brand-1", name: "Example Brand" },
    id: "product-1",
    name: "Detail Product",
    slug: "detail-product",
  });
  expect(context?.brand).toBe(brand);
});

test("projects a selected product with no brand without mutating its input", () => {
  const node = Object.freeze({
    __typename: "Product" as const,
    brand: null,
    id: "product-1",
    name: "Detail Product",
    slug: "detail-product",
  });

  expect(offerDiscoverySelectedProductContext(node)).toEqual({
    brand: null,
    id: "product-1",
    name: "Detail Product",
    slug: "detail-product",
  });
  expect(node).toEqual({
    __typename: "Product",
    brand: null,
    id: "product-1",
    name: "Detail Product",
    slug: "detail-product",
  });
});

test("buildOfferDiscoveryPaginationData preserves every filter in first and next paths", () => {
  expect(
    buildOfferDiscoveryPaginationData({
      endCursor: "next cursor/+",
      filters: {
        activeOnly: false,
        after: "current-cursor",
        compareSlugs: [" alpha ", "beta", "alpha", "", "gamma", "fourth"],
        first: 12,
        merchantId: "merchant/+ id",
        productId: "product/+ id",
        sort: "price_desc",
      },
      hasNextPage: true,
      hasPreviousPage: true,
    }),
  ).toEqual({
    firstHref:
      "/offers?productId=product%2F%2B+id&merchantId=merchant%2F%2B+id&activeOnly=false&first=12&sort=price_desc&slug=alpha&slug=beta&slug=gamma",
    nextHref:
      "/offers?productId=product%2F%2B+id&merchantId=merchant%2F%2B+id&activeOnly=false&first=12&sort=price_desc&slug=alpha&slug=beta&slug=gamma&after=next+cursor%2F%2B",
  });
});

test("buildOfferDiscoveryPaginationData rejects blank and repeated next cursors", () => {
  const filters = { ...DEFAULT_FILTERS, after: "same-cursor" };

  expect(
    buildOfferDiscoveryPaginationData({
      endCursor: "same-cursor",
      filters,
      hasNextPage: true,
      hasPreviousPage: true,
    }).nextHref,
  ).toBeNull();
  expect(
    buildOfferDiscoveryPaginationData({
      endCursor: "  ",
      filters,
      hasNextPage: true,
      hasPreviousPage: true,
    }).nextHref,
  ).toBeNull();
});

test.each([
  [false, "current-cursor"],
  [true, null],
  [true, ""],
] as const)(
  "buildOfferDiscoveryPaginationData hides incomplete first-page facts",
  (hasPreviousPage, after) => {
    expect(
      buildOfferDiscoveryPaginationData({
        endCursor: null,
        filters: {
          ...DEFAULT_FILTERS,
          after,
        },
        hasNextPage: false,
        hasPreviousPage,
      }).firstHref,
    ).toBeNull();
  },
);

test.each([
  [false, "next-cursor"],
  [true, null],
  [true, ""],
] as const)(
  "buildOfferDiscoveryPaginationData hides incomplete next-page facts",
  (hasNextPage, endCursor) => {
    expect(
      buildOfferDiscoveryPaginationData({
        endCursor,
        filters: DEFAULT_FILTERS,
        hasNextPage,
        hasPreviousPage: false,
      }).nextHref,
    ).toBeNull();
  },
);

test("buildOfferDiscoveryPaginationData does not mutate its input", () => {
  const input = Object.freeze({
    endCursor: "next-cursor",
    filters: Object.freeze({
      ...DEFAULT_FILTERS,
      after: "current-cursor",
    }),
    hasNextPage: true,
    hasPreviousPage: true,
  });

  buildOfferDiscoveryPaginationData(input);

  expect(input).toEqual({
    endCursor: "next-cursor",
    filters: {
      ...DEFAULT_FILTERS,
      after: "current-cursor",
    },
    hasNextPage: true,
    hasPreviousPage: true,
  });
});

test("builds the default form reset key and readable offer scope without actions", () => {
  expect(getOfferDiscoveryFilterData(DEFAULT_FILTERS)).toEqual({
    clearMerchantFilterPath: null,
    formKey: JSON.stringify([null, null, true, 6, "default", []]),
    productDetailsPath: null,
    showReset: false,
    scopeBadge: { label: "Active offers", tone: "positive" },
    scopeDescription: "Showing active offers, sorted by Default order, 6 per page.",
    scopeEyebrow: "Offer scope",
    scopeTitle: "Choose a product",
    sortLabel: "Default order",
  });
});

test("projects selected-product identity and filter context with route actions", () => {
  expect(
    getOfferDiscoveryFilterData(
      {
        activeOnly: false,
        after: "stale-cursor",
        compareSlugs: ["detail-product", "second-product"],
        first: 12,
        merchantId: "merchant-1",
        productId: "product-1",
        sort: "price_asc",
      },
      {
        brand: { name: "Example Brand" },
        id: "product-1",
        name: "Detail Product",
        slug: "detail product / 2026",
      },
    ),
  ).toEqual({
    clearMerchantFilterPath:
      "/offers?productId=product-1&activeOnly=false&first=12&sort=price_asc&slug=detail-product&slug=second-product",
    formKey: JSON.stringify([
      "product-1",
      "merchant-1",
      false,
      12,
      "price_asc",
      ["detail-product", "second-product"],
    ]),
    productDetailsPath:
      "/products/detail%20product%20%2F%202026?slug=detail-product&slug=second-product",
    showReset: true,
    scopeBadge: { label: "All offers", tone: "neutral" },
    scopeDescription:
      "Showing all offers, sorted by Price: low to high, 12 per page. Merchant filter applied.",
    scopeEyebrow: "Example Brand",
    scopeTitle: "Detail Product",
    sortLabel: "Price: low to high",
  });
});

test("normalizes unknown sorts before building scope, form keys, and merchant-clear paths", () => {
  const data = getOfferDiscoveryFilterData(
    {
      ...DEFAULT_FILTERS,
      merchantId: "merchant-1",
      productId: "product-1",
      sort: "future_sort",
    },
    {
      brand: null,
      id: "product-1",
      name: "Detail Product",
      slug: "detail-product",
    },
  );

  expect(data.sortLabel).toBe("Default order");
  expect(data.formKey).toBe(JSON.stringify(["product-1", "merchant-1", true, 6, "default", []]));
  expect(data.scopeDescription).toBe(
    "Showing active offers, sorted by Default order, 6 per page. Merchant filter applied.",
  );
  expect(data.scopeEyebrow).toBe("Offer scope");
  expect(data.scopeTitle).toBe("Detail Product");
  expect(data.clearMerchantFilterPath).toBe("/offers?productId=product-1&activeOnly=true&first=6");
  expect(data.showReset).toBe(true);
});

test.each([
  ["default", "Default order"],
  ["price_asc", "Price: low to high"],
  ["price_desc", "Price: high to low"],
  ["merchant_name", "Merchant name"],
])("uses the canonical %s sort label", (sort, sortLabel) => {
  expect(getOfferDiscoveryFilterData({ ...DEFAULT_FILTERS, sort }).sortLabel).toBe(sortLabel);
});

test("keeps reset hidden when sort is the only active filter", () => {
  expect(
    getOfferDiscoveryFilterData({
      ...DEFAULT_FILTERS,
      sort: "price_desc",
    }).showReset,
  ).toBe(false);
});
