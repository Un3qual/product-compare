const FEED_CANDIDATES_DEFAULT_PAGE_SIZE = 20;
const FEED_CANDIDATES_MAX_PAGE_SIZE = 50;

export interface FeedCandidatesPagination {
  first: number;
  after: string | null;
}

export function feedCandidatesPaginationFromUrl(url: URL): FeedCandidatesPagination {
  return {
    first: normalizeFeedCandidatesPageSize(url.searchParams.get("first")),
    after: normalizeFeedCandidatesCursor(url.searchParams.get("after"))
  };
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
