const FEED_CANDIDATES_DEFAULT_PAGE_SIZE = 20;
const FEED_CANDIDATES_MAX_PAGE_SIZE = 50;

export type FeedCandidatesReviewStatus =
  | "PENDING"
  | "SHORTLISTED"
  | "DISMISSED";
export type FeedCandidatesSort =
  | "NAME_ASC"
  | "PRODUCT_COUNT_DESC"
  | "LAST_SEEN_DESC";

export interface FeedCandidatesPagination {
  first: number;
  after: string | null;
  reviewStatus: FeedCandidatesReviewStatus | null;
  sort: FeedCandidatesSort;
}

export function feedCandidatesPaginationFromUrl(url: URL): FeedCandidatesPagination {
  return {
    first: normalizeFeedCandidatesPageSize(url.searchParams.get("first")),
    after: normalizeFeedCandidatesCursor(url.searchParams.get("after")),
    reviewStatus: normalizeFeedCandidatesReviewStatus(
      url.searchParams.get("reviewStatus")
    ),
    sort: normalizeFeedCandidatesSort(url.searchParams.get("sort"))
  };
}

export function feedCandidatesReviewStatusToUrlParam(
  reviewStatus: FeedCandidatesReviewStatus | null
) {
  switch (reviewStatus) {
    case "DISMISSED":
      return "dismissed";
    case "PENDING":
      return "pending";
    case "SHORTLISTED":
      return "shortlisted";
    default:
      return null;
  }
}

export function feedCandidatesSortToUrlParam(sort: FeedCandidatesSort) {
  switch (sort) {
    case "LAST_SEEN_DESC":
      return "last_seen_desc";
    case "PRODUCT_COUNT_DESC":
      return "product_count_desc";
    case "NAME_ASC":
    default:
      return "name_asc";
  }
}

function normalizeFeedCandidatesPageSize(value: string | null) {
  if (!value) {
    return FEED_CANDIDATES_DEFAULT_PAGE_SIZE;
  }

  const trimmedValue = value.trim();

  if (!/^\d+$/.test(trimmedValue)) {
    return FEED_CANDIDATES_DEFAULT_PAGE_SIZE;
  }

  const pageSize = Number.parseInt(trimmedValue, 10);

  return pageSize >= 1 && pageSize <= FEED_CANDIDATES_MAX_PAGE_SIZE
    ? pageSize
    : FEED_CANDIDATES_DEFAULT_PAGE_SIZE;
}

function normalizeFeedCandidatesCursor(value: string | null) {
  const trimmedValue = value?.trim();

  return trimmedValue ? trimmedValue : null;
}

function normalizeFeedCandidatesReviewStatus(
  value: string | null
): FeedCandidatesReviewStatus | null {
  switch (value?.trim().toLowerCase()) {
    case "dismissed":
      return "DISMISSED";
    case "pending":
      return "PENDING";
    case "shortlisted":
      return "SHORTLISTED";
    default:
      return null;
  }
}

function normalizeFeedCandidatesSort(value: string | null): FeedCandidatesSort {
  switch (value?.trim().toLowerCase()) {
    case "last_seen_desc":
      return "LAST_SEEN_DESC";
    case "product_count_desc":
      return "PRODUCT_COUNT_DESC";
    case "name_asc":
    default:
      return "NAME_ASC";
  }
}
