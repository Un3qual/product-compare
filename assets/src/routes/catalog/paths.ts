import { catalogProductSortParam, uniqueCatalogEnumFilters, type CatalogFilters } from "./filters";
import { nextPageCursor } from "$relay/pagination";

export function catalogBrowsePath(
  filters: CatalogFilters,
  first: number,
  after: string | null = null,
  compareSlugs: readonly string[] = [],
) {
  const params = new URLSearchParams();

  params.set("first", String(first));
  appendCatalogFilterParams(params, filters);

  if (after) {
    params.set("after", after);
  }

  appendCompareSlugParams(params, compareSlugs);

  return `/products?${params.toString()}`;
}

export function catalogBrowseFirstPagePath(
  filters: CatalogFilters,
  first: number,
  compareSlugs: readonly string[] = [],
) {
  return catalogBrowsePath(filters, first, null, compareSlugs);
}

export function catalogBrowseNextPagePath(
  filters: CatalogFilters,
  first: number,
  after: string,
  compareSlugs: readonly string[] = [],
) {
  return catalogBrowsePath(filters, first, after, compareSlugs);
}

export function buildCatalogBrowsePaginationData({
  currentAfter,
  endCursor,
  filters,
  first,
  hasNextPage,
  selectedCompareSlugs,
}: {
  readonly currentAfter: string | null;
  readonly endCursor: string | null;
  readonly filters: CatalogFilters;
  readonly first: number;
  readonly hasNextPage: boolean;
  readonly selectedCompareSlugs: readonly string[];
}) {
  const nextCursor = nextPageCursor({ endCursor, hasNextPage }, currentAfter);

  return {
    firstHref: currentAfter
      ? catalogBrowseFirstPagePath(filters, first, selectedCompareSlugs)
      : null,
    nextHref: nextCursor
      ? catalogBrowseNextPagePath(filters, first, nextCursor, selectedCompareSlugs)
      : null,
  };
}

export function catalogBrowseSearchWithNormalizedSort(
  search: string,
  filters: Pick<CatalogFilters, "query" | "sort">,
) {
  const params = new URLSearchParams(search);
  const sortParam = catalogProductSortParam(filters);

  params.delete("sort");

  if (sortParam) {
    params.set("sort", sortParam);
  }

  return params.toString();
}

function appendCatalogFilterParams(params: URLSearchParams, filters: CatalogFilters) {
  if (filters.query) {
    params.set("q", filters.query);
  }

  const sortParam = catalogProductSortParam(filters);

  if (sortParam) {
    params.set("sort", sortParam);
  }

  appendTypeFilterParams(params, filters);
  appendUseCaseFilterParams(params, filters);
  appendNumericFilterParams(params, filters);
  appendBooleanFilterParams(params, filters);
  appendEnumFilterParams(params, filters);
}

function appendTypeFilterParams(params: URLSearchParams, filters: CatalogFilters) {
  if (filters.typeTaxonId) {
    params.set("typeTaxonId", filters.typeTaxonId);
  }

  if (filters.typeTaxonId && filters.includeTypeDescendants) {
    params.set("includeTypeDescendants", "1");
  }
}

function appendUseCaseFilterParams(params: URLSearchParams, filters: CatalogFilters) {
  for (const useCaseTaxonId of filters.useCaseTaxonIds) {
    params.append("useCaseTaxonId", useCaseTaxonId);
  }
}

function appendNumericFilterParams(params: URLSearchParams, filters: CatalogFilters) {
  for (const numericFilter of filters.numeric) {
    if (numericFilter.min != null) {
      params.append(`numeric.${numericFilter.attributeId}.min`, numericFilter.min);
    }

    if (numericFilter.max != null) {
      params.append(`numeric.${numericFilter.attributeId}.max`, numericFilter.max);
    }
  }
}

function appendBooleanFilterParams(params: URLSearchParams, filters: CatalogFilters) {
  for (const booleanFilter of filters.booleans) {
    params.append(`boolean.${booleanFilter.attributeId}`, String(booleanFilter.value));
  }
}

function appendEnumFilterParams(params: URLSearchParams, filters: CatalogFilters) {
  for (const enumFilter of uniqueCatalogEnumFilters(filters.enums)) {
    params.append(`enum.${enumFilter.attributeId}`, enumFilter.enumOptionId);
  }
}

function appendCompareSlugParams(params: URLSearchParams, compareSlugs: readonly string[]) {
  for (const slug of compareSlugs) {
    const trimmedSlug = slug.trim();

    if (trimmedSlug.length > 0) {
      params.append("slug", trimmedSlug);
    }
  }
}
