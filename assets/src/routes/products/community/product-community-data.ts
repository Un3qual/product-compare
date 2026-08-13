import type { ProductCommunityOperationsAnswerProductQuestionMutation } from "$generated/ProductCommunityOperationsAnswerProductQuestionMutation.graphql";
import type { ProductCommunityOperationsAskProductQuestionMutation } from "$generated/ProductCommunityOperationsAskProductQuestionMutation.graphql";
import type { ProductCommunityOperationsQuery } from "$generated/ProductCommunityOperationsQuery.graphql";
import type { ProductCommunityOperationsRemoveCommunityContentMutation } from "$generated/ProductCommunityOperationsRemoveCommunityContentMutation.graphql";
import type { ProductCommunityOperationsSubmitProductReviewMutation } from "$generated/ProductCommunityOperationsSubmitProductReviewMutation.graphql";
import type { ProductCommunityOperationsUpdateProductAnswerMutation } from "$generated/ProductCommunityOperationsUpdateProductAnswerMutation.graphql";
import type { ProductCommunityOperationsUpdateProductQuestionMutation } from "$generated/ProductCommunityOperationsUpdateProductQuestionMutation.graphql";
import type { ProductCommunityOperationsUpdateProductReviewMutation } from "$generated/ProductCommunityOperationsUpdateProductReviewMutation.graphql";
import { hasRouteGraphQLErrors, routeMutationErrorMessage } from "../../route-errors";
import { nextRelayPageCursor } from "../../relay-pagination";

type SubmitReviewPayload =
  ProductCommunityOperationsSubmitProductReviewMutation["response"]["submitProductReview"];
type AskQuestionPayload =
  ProductCommunityOperationsAskProductQuestionMutation["response"]["askProductQuestion"];
type AnswerQuestionPayload =
  ProductCommunityOperationsAnswerProductQuestionMutation["response"]["answerProductQuestion"];
type UpdateReviewPayload =
  ProductCommunityOperationsUpdateProductReviewMutation["response"]["updateProductReview"];
type UpdateQuestionPayload =
  ProductCommunityOperationsUpdateProductQuestionMutation["response"]["updateProductQuestion"];
type UpdateAnswerPayload =
  ProductCommunityOperationsUpdateProductAnswerMutation["response"]["updateProductAnswer"];
type RemoveContentPayload =
  ProductCommunityOperationsRemoveCommunityContentMutation["response"]["removeCommunityContent"];
type CommunityMutationErrors = SubmitReviewPayload["errors"];
type CommunityPageInfo = NonNullable<
  ProductCommunityOperationsQuery["response"]["product"]
>["reviews"]["pageInfo"];

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
  payload: SubmitReviewPayload | null | undefined,
  graphQLErrors?: readonly unknown[] | null,
) {
  return payload?.review && !hasRouteGraphQLErrors(graphQLErrors)
    ? "Review submitted for review."
    : routeMutationErrorMessage(payload?.errors, graphQLErrors);
}

export function resolveProductQuestionMutationMessage(
  payload: AskQuestionPayload | null | undefined,
  graphQLErrors?: readonly unknown[] | null,
) {
  return payload?.question && !hasRouteGraphQLErrors(graphQLErrors)
    ? "Question submitted for review."
    : routeMutationErrorMessage(payload?.errors, graphQLErrors);
}

export function resolveProductAnswerMutationMessage(
  payload: AnswerQuestionPayload | null | undefined,
  graphQLErrors?: readonly unknown[] | null,
) {
  return payload?.answer && !hasRouteGraphQLErrors(graphQLErrors)
    ? "Answer submitted for review."
    : routeMutationErrorMessage(payload?.errors, graphQLErrors);
}

export function resolveProductReviewUpdateMessage(
  payload: UpdateReviewPayload | null | undefined,
  graphQLErrors?: readonly unknown[] | null,
) {
  return resolveCommunityMutationMessage(
    Boolean(payload?.review),
    payload?.errors,
    graphQLErrors,
    "Review updated and submitted for review.",
  );
}

export function resolveProductQuestionUpdateMessage(
  payload: UpdateQuestionPayload | null | undefined,
  graphQLErrors?: readonly unknown[] | null,
) {
  return resolveCommunityMutationMessage(
    Boolean(payload?.question),
    payload?.errors,
    graphQLErrors,
    "Question updated and submitted for review.",
  );
}

export function resolveProductAnswerUpdateMessage(
  payload: UpdateAnswerPayload | null | undefined,
  graphQLErrors?: readonly unknown[] | null,
) {
  return resolveCommunityMutationMessage(
    Boolean(payload?.answer),
    payload?.errors,
    graphQLErrors,
    "Answer updated and submitted for review.",
  );
}

export function resolveCommunityContentRemovalMessage(
  payload: RemoveContentPayload | null | undefined,
  graphQLErrors?: readonly unknown[] | null,
) {
  return resolveCommunityMutationMessage(
    Boolean(payload?.removedContentId),
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
  pageInfo: CommunityPageInfo | null | undefined,
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
  completed: boolean,
  errors: CommunityMutationErrors | undefined,
  graphQLErrors: readonly unknown[] | null | undefined,
  successMessage: string,
) {
  return completed && !hasRouteGraphQLErrors(graphQLErrors)
    ? successMessage
    : routeMutationErrorMessage(errors, graphQLErrors);
}
