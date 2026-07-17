import type { CatalogFilters } from "../../../src/routes/catalog/filters";
import { buildCatalogBrowsePaginationData } from "../../../src/routes/catalog/paths";

const FILTERS: CatalogFilters = {
  query: "oled display",
  sort: "BRAND_NAME_ASC",
  typeTaxonId: "type/laptops",
  includeTypeDescendants: true,
  useCaseTaxonIds: ["gaming & media"],
  numeric: [
    {
      attributeId: "attr-refresh",
      min: "120",
      max: "240"
    }
  ],
  booleans: [
    {
      attributeId: "attr-wireless",
      value: true
    }
  ],
  enums: [
    {
      attributeId: "attr-color",
      enumOptionId: "enum-red"
    }
  ]
};

test("buildCatalogBrowsePaginationData preserves filters, page size, compare order, and cursor encoding", () => {
  expect(
    buildCatalogBrowsePaginationData({
      currentAfter: "current-cursor",
      endCursor: "next cursor/+",
      filters: FILTERS,
      first: 24,
      hasNextPage: true,
      selectedCompareSlugs: ["first product", "second/product"]
    })
  ).toEqual({
    firstHref:
      "/products?first=24&q=oled+display&sort=BRAND_NAME_ASC&typeTaxonId=type%2Flaptops&includeTypeDescendants=1&useCaseTaxonId=gaming+%26+media&numeric.attr-refresh.min=120&numeric.attr-refresh.max=240&boolean.attr-wireless=true&enum.attr-color=enum-red&slug=first+product&slug=second%2Fproduct",
    nextHref:
      "/products?first=24&q=oled+display&sort=BRAND_NAME_ASC&typeTaxonId=type%2Flaptops&includeTypeDescendants=1&useCaseTaxonId=gaming+%26+media&numeric.attr-refresh.min=120&numeric.attr-refresh.max=240&boolean.attr-wireless=true&enum.attr-color=enum-red&after=next+cursor%2F%2B&slug=first+product&slug=second%2Fproduct"
  });
});

test.each([null, ""])(
  "buildCatalogBrowsePaginationData hides the first-page link without a current cursor",
  (currentAfter) => {
    expect(
      buildCatalogBrowsePaginationData({
        currentAfter,
        endCursor: null,
        filters: FILTERS,
        first: 12,
        hasNextPage: false,
        selectedCompareSlugs: []
      }).firstHref
    ).toBeNull();
  }
);

test.each([
  [false, "next-cursor"],
  [true, null],
  [true, ""]
] as const)(
  "buildCatalogBrowsePaginationData hides incomplete next-page facts",
  (hasNextPage, endCursor) => {
    expect(
      buildCatalogBrowsePaginationData({
        currentAfter: null,
        endCursor,
        filters: FILTERS,
        first: 12,
        hasNextPage,
        selectedCompareSlugs: []
      }).nextHref
    ).toBeNull();
  }
);

test("buildCatalogBrowsePaginationData does not mutate filters or compare slugs", () => {
  const filters: CatalogFilters = {
    ...FILTERS,
    useCaseTaxonIds: [...FILTERS.useCaseTaxonIds],
    numeric: FILTERS.numeric.map((filter) => ({ ...filter })),
    booleans: FILTERS.booleans.map((filter) => ({ ...filter })),
    enums: FILTERS.enums.map((filter) => ({ ...filter }))
  };
  const selectedCompareSlugs = ["first-product", " second-product "];
  const originalFilters = structuredClone(filters);
  const originalCompareSlugs = [...selectedCompareSlugs];

  buildCatalogBrowsePaginationData({
    currentAfter: "current-cursor",
    endCursor: "next-cursor",
    filters,
    first: 50,
    hasNextPage: true,
    selectedCompareSlugs
  });

  expect(filters).toEqual(originalFilters);
  expect(selectedCompareSlugs).toEqual(originalCompareSlugs);
});
