import type { ProductSort } from "../../../../src/__generated__/BrowseRouteQuery.graphql";
import { catalogProductSortFromValue } from "../../../../src/routes/catalog/filters";

test.each(["RELEVANCE", "ID_ASC", "NAME_ASC", "BRAND_NAME_ASC", "NEWEST"] as const)(
  "catalogProductSortFromValue preserves supported value %s",
  (value) => {
    expect(catalogProductSortFromValue(value)).toBe(value);
  },
);

test.each(["", "UNKNOWN", "FUTURE_SORT", "%future added value" satisfies ProductSort])(
  "catalogProductSortFromValue falls back to catalog order for unsupported value %s",
  (value) => {
    expect(catalogProductSortFromValue(value)).toBe("ID_ASC");
  },
);
