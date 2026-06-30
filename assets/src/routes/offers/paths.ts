import type { OfferDiscoveryFilters } from "./loader";

export function offerDiscoveryPath(filters: OfferDiscoveryFilters, after: string | null) {
  const params = new URLSearchParams();

  if (filters.productId) {
    params.set("productId", filters.productId);
  }

  if (filters.merchantId) {
    params.set("merchantId", filters.merchantId);
  }

  params.set("activeOnly", String(filters.activeOnly));
  params.set("first", String(filters.first));

  if (after) {
    params.set("after", after);
  }

  return `/offers?${params.toString()}`;
}
