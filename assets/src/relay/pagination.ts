export function nextPageCursor(
  pageInfo:
    | {
        readonly endCursor?: string | null;
        readonly hasNextPage?: boolean | null;
      }
    | null
    | undefined,
  currentAfter: string | null = null,
) {
  const cursor = pageInfo?.hasNextPage ? pageInfo.endCursor : null;
  return cursor?.trim() && cursor !== currentAfter ? cursor : null;
}
