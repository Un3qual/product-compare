export function buildProductReviewInput({
  body: rawBody,
  productId,
  rating,
  title: rawTitle
}: {
  body: unknown;
  productId: string;
  rating: unknown;
  title: unknown;
}) {
  const body = normalizedCommunityText(rawBody);
  const title = normalizedCommunityText(rawTitle);

  return {
    productId,
    rating: Number(rating),
    ...(title ? { title } : {}),
    ...(body ? { body } : {})
  };
}

export function buildProductQuestionInput({
  body: rawBody,
  productId,
  title
}: {
  body: unknown;
  productId: string;
  title: unknown;
}) {
  const body = normalizedCommunityText(rawBody);

  return {
    productId,
    title: normalizedCommunityText(title),
    ...(body ? { body } : {})
  };
}

export function buildProductAnswerInput({
  body,
  questionId
}: {
  body: unknown;
  questionId: string;
}) {
  return {
    questionId,
    body: normalizedCommunityText(body)
  };
}

export function publishedReviewSummary({
  averageRating,
  count
}: {
  averageRating: string;
  count: number;
}) {
  return count
    ? `${averageRating} out of 5 from ${count} published review${count === 1 ? "" : "s"}.`
    : "No published reviews yet.";
}

export function acceptedAnswerAuthorLabel(
  answerId: string,
  acceptedAnswerId: string | null | undefined,
  authorLabel: string
) {
  return answerId === acceptedAnswerId
    ? `Accepted answer · ${authorLabel}`
    : authorLabel;
}

export function nextCommunityPageCursor({
  endCursor,
  hasNextPage
}: {
  readonly endCursor: string | null | undefined;
  readonly hasNextPage: boolean;
}) {
  return hasNextPage && endCursor ? endCursor : null;
}

export function appendUniqueCommunityItems<T extends { readonly id: string }>(
  existing: T[],
  incoming: readonly T[]
): T[] {
  if (incoming.length === 0) {
    return existing;
  }

  const seen = new Set(existing.map(({ id }) => id));
  const appended: T[] = [];

  for (const item of incoming) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      appended.push(item);
    }
  }

  return appended.length ? [...existing, ...appended] : existing;
}

function normalizedCommunityText(value: unknown) {
  return String(value ?? "").trim();
}
