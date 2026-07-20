export type RelayPageInfo = {
  readonly endCursor?: string | null;
  readonly hasNextPage?: boolean | null;
};

export function nextRelayPageCursor(
  pageInfo: RelayPageInfo | null | undefined,
  currentAfter: string | null = null
) {
  const endCursor = pageInfo?.endCursor;

  return pageInfo?.hasNextPage === true &&
    typeof endCursor === "string" &&
    endCursor.trim().length > 0 &&
    endCursor !== currentAfter
    ? endCursor
    : null;
}
