export type SavedComparisonsNavigationStatus = "ready" | "empty" | "unauthorized";

export type SavedComparisonsPaginationInput = {
  after?: string | null;
  endCursor?: string | null;
  hasNextPage?: boolean;
  status: SavedComparisonsNavigationStatus;
};

export type SavedComparisonsPagination = {
  firstHref: string | null;
  nextHref: string | null;
};

export function buildSavedComparisonReopenPath(slugs: readonly string[]) {
  const searchParams = new URLSearchParams();

  for (const slug of slugs) {
    searchParams.append("slug", slug);
  }

  return `/compare?${searchParams.toString()}`;
}

export function buildSavedComparisonsPagination({
  after,
  endCursor,
  hasNextPage,
  status
}: SavedComparisonsPaginationInput): SavedComparisonsPagination {
  if (status === "unauthorized") {
    return { firstHref: null, nextHref: null };
  }

  return {
    firstHref: after ? "/compare/saved" : null,
    nextHref:
      hasNextPage && endCursor && endCursor !== after
        ? savedComparisonsPagePath(endCursor)
        : null
  };
}

function savedComparisonsPagePath(after: string) {
  const searchParams = new URLSearchParams({ after });

  return `/compare/saved?${searchParams.toString()}`;
}
