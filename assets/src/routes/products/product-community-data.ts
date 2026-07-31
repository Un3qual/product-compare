import { hasRouteGraphQLErrors, routeMutationErrorMessage } from "../route-errors";
import { nextRelayPageCursor, type RelayPageInfo } from "../relay-pagination";

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
  verifiedPurchase,
}: PublishedReviewRowFacts) {
  const normalizedRating = normalizePublishedReviewRating(rating);

  return {
    authorCopy: `${authorLabel} · ${verifiedPurchase ? "Verified purchase" : "Purchase not verified"}`,
    ratingStars: `${"★".repeat(normalizedRating)}${"☆".repeat(5 - normalizedRating)}`,
    title: title ?? `${normalizedRating} out of 5`,
  };
}

function normalizePublishedReviewRating(rating: number) {
  if (Number.isNaN(rating)) {
    return 0;
  }

  return Math.min(5, Math.max(0, Math.round(rating)));
}

export function resolveProductReviewMutationMessage(
  payload: (CommunityMutationPayload & { readonly review?: unknown }) | null | undefined,
  graphQLErrors?: readonly unknown[] | null,
) {
  return payload?.review && !hasRouteGraphQLErrors(graphQLErrors)
    ? "Review submitted for moderation."
    : routeMutationErrorMessage(payload?.errors, graphQLErrors);
}

export function resolveProductQuestionMutationMessage(
  payload: (CommunityMutationPayload & { readonly question?: unknown }) | null | undefined,
  graphQLErrors?: readonly unknown[] | null,
) {
  return payload?.question && !hasRouteGraphQLErrors(graphQLErrors)
    ? "Question submitted for moderation."
    : routeMutationErrorMessage(payload?.errors, graphQLErrors);
}

export function resolveProductAnswerMutationMessage(
  payload: (CommunityMutationPayload & { readonly answer?: unknown }) | null | undefined,
  graphQLErrors?: readonly unknown[] | null,
) {
  return payload?.answer && !hasRouteGraphQLErrors(graphQLErrors)
    ? "Answer submitted for moderation."
    : routeMutationErrorMessage(payload?.errors, graphQLErrors);
}

export function resolveProductReviewUpdateMessage(
  payload: (CommunityMutationPayload & { readonly review?: unknown }) | null | undefined,
  graphQLErrors?: readonly unknown[] | null,
) {
  return resolveCommunityMutationMessage(
    payload?.review,
    payload?.errors,
    graphQLErrors,
    "Review updated and submitted for moderation.",
  );
}

export function resolveProductQuestionUpdateMessage(
  payload: (CommunityMutationPayload & { readonly question?: unknown }) | null | undefined,
  graphQLErrors?: readonly unknown[] | null,
) {
  return resolveCommunityMutationMessage(
    payload?.question,
    payload?.errors,
    graphQLErrors,
    "Question updated and submitted for moderation.",
  );
}

export function resolveProductAnswerUpdateMessage(
  payload: (CommunityMutationPayload & { readonly answer?: unknown }) | null | undefined,
  graphQLErrors?: readonly unknown[] | null,
) {
  return resolveCommunityMutationMessage(
    payload?.answer,
    payload?.errors,
    graphQLErrors,
    "Answer updated and submitted for moderation.",
  );
}

export function resolveCommunityContentRemovalMessage(
  payload: (CommunityMutationPayload & { readonly removedContentId?: unknown }) | null | undefined,
  graphQLErrors?: readonly unknown[] | null,
) {
  return resolveCommunityMutationMessage(
    payload?.removedContentId,
    payload?.errors,
    graphQLErrors,
    "Community content removed.",
  );
}

export function buildProductReviewInput({
  body: rawBody,
  idempotencyKey,
  productId,
  rating,
  title: rawTitle,
}: {
  body: unknown;
  idempotencyKey: string;
  productId: string;
  rating: unknown;
  title: unknown;
}) {
  const body = normalizedCommunityText(rawBody);
  const title = normalizedCommunityText(rawTitle);

  return {
    idempotencyKey,
    productId,
    rating: Number(rating),
    ...(title ? { title } : {}),
    ...(body ? { body } : {}),
  };
}

export function buildProductQuestionInput({
  body: rawBody,
  idempotencyKey,
  productId,
  title,
}: {
  body: unknown;
  idempotencyKey: string;
  productId: string;
  title: unknown;
}) {
  const body = normalizedCommunityText(rawBody);

  return {
    idempotencyKey,
    productId,
    title: normalizedCommunityText(title),
    ...(body ? { body } : {}),
  };
}

export function buildProductAnswerInput({
  body,
  idempotencyKey,
  questionId,
}: {
  body: unknown;
  idempotencyKey: string;
  questionId: string;
}) {
  return {
    body: normalizedCommunityText(body),
    idempotencyKey,
    questionId,
  };
}

export function publishedReviewSummary({
  averageRating,
  count,
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
  authorLabel: string,
) {
  return answerId === acceptedAnswerId ? `Accepted answer · ${authorLabel}` : authorLabel;
}

export function nextCommunityPageCursor(
  pageInfo: RelayPageInfo | null | undefined,
  currentAfter: string | null = null,
) {
  return nextRelayPageCursor(pageInfo, currentAfter);
}

export function appendUniqueCommunityItems<T extends { readonly id: string }>(
  existing: T[],
  incoming: readonly T[],
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

function resolveCommunityMutationMessage(
  completion: unknown,
  errors: unknown,
  graphQLErrors: readonly unknown[] | null | undefined,
  successMessage: string,
) {
  return completion && !hasRouteGraphQLErrors(graphQLErrors)
    ? successMessage
    : routeMutationErrorMessage(errors, graphQLErrors);
}
