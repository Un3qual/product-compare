import type { ProductCommunityOperationsAnswerProductQuestionMutation } from "$generated/ProductCommunityOperationsAnswerProductQuestionMutation.graphql";
import type { ProductCommunityOperationsAskProductQuestionMutation } from "$generated/ProductCommunityOperationsAskProductQuestionMutation.graphql";
import type { ProductCommunityOperationsQuery } from "$generated/ProductCommunityOperationsQuery.graphql";
import type { ProductCommunityOperationsRemoveCommunityContentMutation } from "$generated/ProductCommunityOperationsRemoveCommunityContentMutation.graphql";
import type { ProductCommunityOperationsSubmitProductReviewMutation } from "$generated/ProductCommunityOperationsSubmitProductReviewMutation.graphql";
import type { ProductCommunityOperationsUpdateProductAnswerMutation } from "$generated/ProductCommunityOperationsUpdateProductAnswerMutation.graphql";
import type { ProductCommunityOperationsUpdateProductQuestionMutation } from "$generated/ProductCommunityOperationsUpdateProductQuestionMutation.graphql";
import type { ProductCommunityOperationsUpdateProductReviewMutation } from "$generated/ProductCommunityOperationsUpdateProductReviewMutation.graphql";
import type { ProductCommunityItems_review$data } from "$generated/ProductCommunityItems_review.graphql";
import {
  hasGraphQLErrors,
  mutationErrorMessage,
  type MutationGraphQLErrors,
} from "$relay/mutation-errors";

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
type ReviewSummary = NonNullable<
  ProductCommunityOperationsQuery["response"]["product"]
>["reviewSummary"];
export type PublishedReviewRowFacts = Pick<
  ProductCommunityItems_review$data,
  "authorLabel" | "rating" | "title" | "verifiedPurchase"
>;

export function publishedReviewRowDisplayData({
  authorLabel,
  rating,
  title,
  verifiedPurchase,
}: PublishedReviewRowFacts) {
  return {
    authorCopy: `${authorLabel} · ${verifiedPurchase ? "Verified purchase" : "Purchase not verified"}`,
    ratingStars: `${"★".repeat(rating)}${"☆".repeat(5 - rating)}`,
    title: title ?? `${rating} out of 5`,
  };
}

export function resolveProductReviewMutationMessage(
  payload: SubmitReviewPayload,
  graphQLErrors: MutationGraphQLErrors = null,
) {
  return payload.review && !hasGraphQLErrors(graphQLErrors)
    ? "Review submitted for review."
    : mutationErrorMessage(payload.errors, graphQLErrors);
}

export function resolveProductQuestionMutationMessage(
  payload: AskQuestionPayload,
  graphQLErrors: MutationGraphQLErrors = null,
) {
  return payload.question && !hasGraphQLErrors(graphQLErrors)
    ? "Question submitted for review."
    : mutationErrorMessage(payload.errors, graphQLErrors);
}

export function resolveProductAnswerMutationMessage(
  payload: AnswerQuestionPayload,
  graphQLErrors: MutationGraphQLErrors = null,
) {
  return payload.answer && !hasGraphQLErrors(graphQLErrors)
    ? "Answer submitted for review."
    : mutationErrorMessage(payload.errors, graphQLErrors);
}

export function resolveProductReviewUpdateMessage(
  payload: UpdateReviewPayload,
  graphQLErrors: MutationGraphQLErrors = null,
) {
  return resolveCommunityMutationMessage(
    Boolean(payload.review),
    payload.errors,
    graphQLErrors,
    "Review updated and submitted for review.",
  );
}

export function resolveProductQuestionUpdateMessage(
  payload: UpdateQuestionPayload,
  graphQLErrors: MutationGraphQLErrors = null,
) {
  return resolveCommunityMutationMessage(
    Boolean(payload.question),
    payload.errors,
    graphQLErrors,
    "Question updated and submitted for review.",
  );
}

export function resolveProductAnswerUpdateMessage(
  payload: UpdateAnswerPayload,
  graphQLErrors: MutationGraphQLErrors = null,
) {
  return resolveCommunityMutationMessage(
    Boolean(payload.answer),
    payload.errors,
    graphQLErrors,
    "Answer updated and submitted for review.",
  );
}

export function resolveCommunityContentRemovalMessage(
  payload: RemoveContentPayload,
  graphQLErrors: MutationGraphQLErrors = null,
) {
  return resolveCommunityMutationMessage(
    Boolean(payload.removedContentId),
    payload.errors,
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

export function publishedReviewSummary({ averageRating, count }: ReviewSummary) {
  return count
    ? `${averageRating ?? "—"} out of 5 from ${count} published review${count === 1 ? "" : "s"}.`
    : "No published reviews yet.";
}

export function acceptedAnswerAuthorLabel(
  answerId: string,
  acceptedAnswerId: string | null,
  authorLabel: string,
) {
  return answerId === acceptedAnswerId ? `Accepted answer · ${authorLabel}` : authorLabel;
}

function normalizedCommunityText(value: unknown) {
  return String(value ?? "").trim();
}

function resolveCommunityMutationMessage(
  completed: boolean,
  errors: CommunityMutationErrors,
  graphQLErrors: MutationGraphQLErrors,
  successMessage: string,
) {
  return completed && !hasGraphQLErrors(graphQLErrors)
    ? successMessage
    : mutationErrorMessage(errors, graphQLErrors);
}
