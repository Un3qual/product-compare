import {
  DEFAULT_OFFERS_PAGE_SIZE,
  normalizeOfferDiscoverySort,
  type OfferDiscoveryFilters,
  type OfferDiscoverySort,
} from "./offer-discovery-filter-data";

const MAX_OFFERS_PAGE_SIZE = 50;

export function offerDiscoveryFiltersFromUrl(url: URL): OfferDiscoveryFilters {
  return {
    activeOnly: nonBlankParam(url, "activeOnly") !== "false",
    after: nonBlankParam(url, "after"),
    first: pageSizeFromUrl(url),
    merchantId: nonBlankParam(url, "merchantId"),
    productId: nonBlankParam(url, "productId"),
    sort: sortFromUrl(url),
  };
}

export function offerDiscoveryInputFromFilters(filters: OfferDiscoveryFilters) {
  return {
    activeOnly: filters.activeOnly,
    ...(filters.merchantId ? { merchantId: filters.merchantId } : {}),
    productId: filters.productId ?? "",
  };
}

function pageSizeFromUrl(url: URL) {
  const value = nonBlankParam(url, "first");
  if (!value || !/^\d+$/.test(value)) return DEFAULT_OFFERS_PAGE_SIZE;

  const parsedValue = Number.parseInt(value, 10);
  return parsedValue >= 1 && parsedValue <= MAX_OFFERS_PAGE_SIZE
    ? parsedValue
    : DEFAULT_OFFERS_PAGE_SIZE;
}

function sortFromUrl(url: URL): OfferDiscoverySort {
  return normalizeOfferDiscoverySort(nonBlankParam(url, "sort"));
}

function nonBlankParam(url: URL, name: string) {
  const value = url.searchParams.get(name)?.trim();
  return value === "" ? null : (value ?? null);
}
