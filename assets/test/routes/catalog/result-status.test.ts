import { catalogResultStatus } from "../../../src/routes/catalog/result-status";

test.each([
  {
    input: { hasActiveFilters: false, hasVisibleProducts: false, resultCount: 0 },
    expected: { guidance: "No matching products", emptyMessage: "No products available yet." }
  },
  {
    input: { hasActiveFilters: true, hasVisibleProducts: false, resultCount: 0 },
    expected: {
      guidance: "No matching products",
      emptyMessage: "No products match these filters."
    }
  },
  {
    input: { hasActiveFilters: true, hasVisibleProducts: false, resultCount: 3 },
    expected: {
      guidance: "3 matching products",
      emptyMessage: "No products available yet."
    }
  },
  {
    input: { hasActiveFilters: true, hasVisibleProducts: true, resultCount: 1 },
    expected: { guidance: "1 matching product", emptyMessage: null }
  },
  {
    input: { hasActiveFilters: false, hasVisibleProducts: true, resultCount: 3 },
    expected: { guidance: "3 matching products", emptyMessage: null }
  }
])("derives catalog result status for %#", ({ input, expected }) => {
  expect(catalogResultStatus(input)).toEqual(expected);
});
