import { catalogProductSortFromValue } from "../../../src/routes/catalog/filters";

test.each(["RELEVANCE", "ID_ASC", "NAME_ASC", "BRAND_NAME_ASC", "NEWEST"] as const)(
  "catalogProductSortFromValue preserves supported value %s",
  (value) => {
    expect(catalogProductSortFromValue(value)).toBe(value);
  },
);

test.each(["", "UNKNOWN", "FUTURE_SORT"])(
  "catalogProductSortFromValue falls back to catalog order for unsupported value %s",
  (value) => {
    expect(catalogProductSortFromValue(value)).toBe("ID_ASC");
  },
);
