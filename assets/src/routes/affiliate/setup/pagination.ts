import type { MerchantPagination } from "../../merchants/pagination";

export type AffiliateSetupMerchantPagination = MerchantPagination;

export function affiliateSetupPagePath(pagination: AffiliateSetupMerchantPagination) {
  const params = new URLSearchParams();

  params.set("first", String(pagination.first));

  if (pagination.after) {
    params.set("after", pagination.after);
  }

  return `/affiliate/setup?${params.toString()}`;
}
