import {
  MAX_COMPARE_PRODUCTS,
  buildCurrentRoutePathWithCompareSlugs,
  normalizedCompareSlugs,
  selectedCompareSlugsFromSearch,
} from "../compare/paths";
import { catalogBrowseFirstPagePath } from "../catalog/paths";
import type { CatalogFilters } from "../catalog/filters";

const HOME_CATALOG_PAGE_SIZE = 12;
const HOME_SEARCH_QUERY_LIMIT = 100;

const EMPTY_CATALOG_FILTERS = {
  booleans: [],
  enums: [],
  numeric: [],
  useCaseTaxonIds: [],
} satisfies CatalogFilters;

export function selectedHomeCompareSlugs(search: string) {
  return selectedCompareSlugsFromSearch(search, { maxProducts: MAX_COMPARE_PRODUCTS });
}

export function homeCatalogSearchPath(search: string, selectedSlugs: readonly string[]) {
  const query = search.trim().slice(0, HOME_SEARCH_QUERY_LIMIT);

  return catalogBrowseFirstPagePath(
    query.length > 0 ? { ...EMPTY_CATALOG_FILTERS, query } : EMPTY_CATALOG_FILTERS,
    HOME_CATALOG_PAGE_SIZE,
    normalizedCompareSlugs(selectedSlugs, { maxProducts: MAX_COMPARE_PRODUCTS }),
  );
}

export function homeCategoryCatalogPath(categoryId: string, selectedSlugs: readonly string[]) {
  return catalogBrowseFirstPagePath(
    {
      ...EMPTY_CATALOG_FILTERS,
      includeTypeDescendants: true,
      typeTaxonId: categoryId,
    },
    HOME_CATALOG_PAGE_SIZE,
    normalizedCompareSlugs(selectedSlugs, { maxProducts: MAX_COMPARE_PRODUCTS }),
  );
}

export function homeProductDetailPath(productSlug: string, selectedSlugs: readonly string[]) {
  return buildCurrentRoutePathWithCompareSlugs(
    `/products/${encodeURIComponent(productSlug)}`,
    "",
    normalizedCompareSlugs(selectedSlugs, { maxProducts: MAX_COMPARE_PRODUCTS }),
  );
}
