import { nextRelayPageCursor } from "../relay-pagination";

const MERCHANT_DEFAULT_PAGE_SIZE = 20;
const MERCHANT_MAX_PAGE_SIZE = 50;

export interface MerchantPagination {
  after: string | null;
  first: number;
}

export function merchantDirectoryPagePath(
  pagination: MerchantPagination,
  after?: string | null
) {
  const params = new URLSearchParams();

  params.set("first", String(pagination.first));

  if (after) {
    params.set("after", after);
  }

  return `/merchants?${params.toString()}`;
}

export function buildMerchantDirectoryPaginationData({
  endCursor,
  hasNextPage,
  hasPreviousPage,
  pagination
}: {
  readonly endCursor: string | null;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
  readonly pagination: Readonly<MerchantPagination>;
}) {
  const nextCursor = nextRelayPageCursor(
    { endCursor, hasNextPage },
    pagination.after
  );

  return {
    firstHref:
      hasPreviousPage && pagination.after
        ? merchantDirectoryPagePath(pagination)
        : null,
    nextHref:
      nextCursor
        ? merchantDirectoryPagePath(pagination, nextCursor)
        : null
  };
}

export function merchantPaginationFromUrl(url: URL): MerchantPagination {
  return {
    first: normalizeMerchantPageSize(url.searchParams.get("first")),
    after: normalizeMerchantCursor(url.searchParams.get("after"))
  };
}

function normalizeMerchantPageSize(value: string | null) {
  const normalized = value?.trim();

  if (!normalized || !/^\d+$/.test(normalized)) {
    return MERCHANT_DEFAULT_PAGE_SIZE;
  }

  const pageSize = Number(normalized);

  return pageSize >= 1 && pageSize <= MERCHANT_MAX_PAGE_SIZE
    ? pageSize
    : MERCHANT_DEFAULT_PAGE_SIZE;
}

function normalizeMerchantCursor(value: string | null) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}
