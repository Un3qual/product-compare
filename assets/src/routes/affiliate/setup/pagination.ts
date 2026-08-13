import type { MerchantPagination } from "../../merchants/pagination";
import { nextPageCursor } from "$relay/pagination";

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
  pagination,
}: {
  readonly endCursor: string | null;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
  readonly pagination: Readonly<AffiliateSetupMerchantPagination>;
}) {
  const nextCursor = nextPageCursor({ endCursor, hasNextPage }, pagination.after);

  return {
    firstHref:
      hasPreviousPage && pagination.after
        ? affiliateSetupPagePath({ ...pagination, after: null })
        : null,
    nextHref: nextCursor ? affiliateSetupPagePath({ ...pagination, after: nextCursor }) : null,
  };
}
