import {
  hasRouteGraphQLErrors,
  routeMutationErrorMessage
} from "../route-errors";

type CommunityMutationPayload = {
  readonly errors?: unknown;
};

export type PublishedReviewRowFacts = {
  readonly authorLabel: string;
  readonly rating: number;
  readonly title: string | null | undefined;
  readonly verifiedPurchase: boolean;
};

export function publishedReviewRowDisplayData({
  authorLabel,
  rating,
  title,
  verifiedPurchase
}: PublishedReviewRowFacts) {
  return {
    authorCopy: `${authorLabel} · ${verifiedPurchase ? "Verified purchase" : "Purchase not verified"}`,
    ratingStars: `${"★".repeat(rating)}${"☆".repeat(5 - rating)}`,
    title: title ?? `${rating} out of 5`
  };
}

export function resolveProductReviewMutationMessage(
  payload: (CommunityMutationPayload & { readonly review?: unknown }) | null | undefined,
  graphQLErrors?: readonly unknown[] | null
) {
  return payload?.review && !hasRouteGraphQLErrors(graphQLErrors)
    ? "Review submitted for moderation."
    : routeMutationErrorMessage(payload?.errors, graphQLErrors);
}

export function resolveProductQuestionMutationMessage(
  payload: (CommunityMutationPayload & { readonly question?: unknown }) | null | undefined,
  graphQLErrors?: readonly unknown[] | null
) {
  return payload?.question && !hasRouteGraphQLErrors(graphQLErrors)
    ? "Question submitted for moderation."
    : routeMutationErrorMessage(payload?.errors, graphQLErrors);
}

export function resolveProductAnswerMutationMessage(
  payload: (CommunityMutationPayload & { readonly answer?: unknown }) | null | undefined,
  graphQLErrors?: readonly unknown[] | null
) {
  return payload?.answer && !hasRouteGraphQLErrors(graphQLErrors)
    ? "Answer submitted for moderation."
    : routeMutationErrorMessage(payload?.errors, graphQLErrors);
}

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
