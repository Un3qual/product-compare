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

export function buildAffiliateSetupPaginationData({
  endCursor,
  hasNextPage,
  hasPreviousPage,
  pagination
}: {
  readonly endCursor: string | null;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
  readonly pagination: Readonly<AffiliateSetupMerchantPagination>;
}) {
  return {
    firstHref:
      hasPreviousPage && pagination.after
        ? affiliateSetupPagePath({ ...pagination, after: null })
        : null,
    nextHref:
      hasNextPage && endCursor
        ? affiliateSetupPagePath({ ...pagination, after: endCursor })
        : null
  };
}
