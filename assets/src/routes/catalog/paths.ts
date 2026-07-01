import { uniqueCatalogEnumFilters, type CatalogFilters } from "./filters";

export function catalogBrowsePath(filters: CatalogFilters, first: number, after?: string | null) {
  const params = new URLSearchParams();

  params.set("first", String(first));
  appendCatalogFilterParams(params, filters);

  if (after) {
    params.set("after", after);
  }

  return `/products?${params.toString()}`;
}

export function catalogBrowseFirstPagePath(filters: CatalogFilters, first: number) {
  return catalogBrowsePath(filters, first);
}

export function catalogBrowseNextPagePath(filters: CatalogFilters, first: number, after: string) {
  return catalogBrowsePath(filters, first, after);
}

function appendCatalogFilterParams(params: URLSearchParams, filters: CatalogFilters) {
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
    if (numericFilter.min !== undefined) {
      params.append(`numeric.${numericFilter.attributeId}.min`, numericFilter.min);
    }

    if (numericFilter.max !== undefined) {
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
