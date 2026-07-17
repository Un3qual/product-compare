import { parseGraphQLDateTime } from "../../graphql-datetime";
import { formatProductDateTime } from "../../product-formatting";
import {
  feedCandidatesReviewStatusToUrlParam,
  feedCandidatesSortToUrlParam,
  type FeedCandidatesPagination
} from "./pagination";

export interface FeedCandidateReviewData {
  advertiserCountry?: string | null;
  advertiserName?: string | null;
  currency?: string | null;
  language?: string | null;
  productCount?: number | null;
  providerFeedId: string;
  reviewStatus?: string | null;
  reviewedAt?: string | null;
  sourceFeedType?: string | null;
}

export type ReviewStatusTone = "positive" | "neutral" | "warning";

export interface ReviewStatusCounts {
  dismissed: number;
  pending: number;
  shortlisted: number;
}

type CandidateFitContribution = {
  points: number;
  reason: string | null;
};

const NO_CANDIDATE_FIT = { points: 0, reason: null } as const;

const PRODUCT_COUNT_FIT_TIERS = [
  { minimum: 10000, points: 50, reason: "10000+ products" },
  { minimum: 1000, points: 35, reason: "1000+ products" },
  { minimum: 100, points: 20, reason: "100+ products" },
  { minimum: 1, points: 10, reason: "1+ products" }
] as const;

export function formatFeedCandidateName(
  candidate: Pick<FeedCandidateReviewData, "advertiserName" | "providerFeedId">
) {
  return candidate.advertiserName ?? candidate.providerFeedId;
}

export function formatProductCount(productCount: number | null | undefined) {
  if (typeof productCount !== "number") {
    return "Product count unavailable";
  }

  return productCount === 1 ? "1 product" : `${productCount} products`;
}

export function candidateFitScore(candidate: FeedCandidateReviewData) {
  return candidateFitContributions(candidate).reduce(
    (score, contribution) => score + contribution.points,
    0
  );
}

export function candidateFitReasons(candidate: FeedCandidateReviewData) {
  return candidateFitContributions(candidate)
    .map((contribution) => contribution.reason)
    .filter((reason): reason is string => typeof reason === "string");
}

export function formatFeedCandidateReviewStatus(reviewStatus: string | null | undefined) {
  switch (reviewStatus) {
    case "DISMISSED":
      return "Dismissed";
    case "SHORTLISTED":
      return "Shortlisted";
    default:
      return "Pending";
  }
}

export function reviewStatusTone(
  reviewStatus: string | null | undefined
): ReviewStatusTone {
  if (reviewStatus === "SHORTLISTED") {
    return "positive";
  }

  if (reviewStatus === "DISMISSED") {
    return "neutral";
  }

  return "warning";
}

export function countByReviewStatus(
  candidates: ReadonlyArray<Pick<FeedCandidateReviewData, "reviewStatus">>
): ReviewStatusCounts {
  return candidates.reduce<ReviewStatusCounts>(
    (counts, candidate) => {
      switch (candidate.reviewStatus) {
        case "SHORTLISTED":
          counts.shortlisted += 1;
          break;
        case "DISMISSED":
          counts.dismissed += 1;
          break;
        default:
          counts.pending += 1;
          break;
      }

      return counts;
    },
    { dismissed: 0, pending: 0, shortlisted: 0 }
  );
}

export function formatReviewedAt(value: string | null | undefined) {
  const date = parseGraphQLDateTime(value);

  return date ? formatProductDateTime(date) : "";
}

export function feedCandidatesFirstPagePath(
  pagination: Pick<FeedCandidatesPagination, "first" | "reviewStatus" | "sort">
) {
  const params = new URLSearchParams();

  params.set("first", String(pagination.first));
  appendFeedCandidatesFilterParams(params, pagination);

  return `/ingestion/feed-candidates?${params.toString()}`;
}

export function feedCandidatesNextPagePath(
  pagination: Pick<FeedCandidatesPagination, "first" | "reviewStatus" | "sort">,
  endCursor: string
) {
  const params = new URLSearchParams();

  params.set("first", String(pagination.first));
  params.set("after", endCursor);
  appendFeedCandidatesFilterParams(params, pagination);

  return `/ingestion/feed-candidates?${params.toString()}`;
}

export function buildFeedCandidatePaginationData({
  endCursor,
  hasNextPage,
  hasPreviousPage,
  pagination
}: {
  readonly endCursor: string | null;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
  readonly pagination: Readonly<FeedCandidatesPagination>;
}) {
  return {
    firstHref:
      hasPreviousPage && pagination.after
        ? feedCandidatesFirstPagePath(pagination)
        : null,
    nextHref:
      hasNextPage && endCursor
        ? feedCandidatesNextPagePath(pagination, endCursor)
        : null
  };
}

function appendFeedCandidatesFilterParams(
  params: URLSearchParams,
  pagination: Pick<FeedCandidatesPagination, "reviewStatus" | "sort">
) {
  const reviewStatus = feedCandidatesReviewStatusToUrlParam(pagination.reviewStatus);

  if (reviewStatus) {
    params.set("reviewStatus", reviewStatus);
  }

  params.set("sort", feedCandidatesSortToUrlParam(pagination.sort));
}

function candidateFitContributions(candidate: FeedCandidateReviewData) {
  return [
    productCountFit(candidate.productCount),
    exactCandidateFieldFit(candidate.advertiserCountry, "US", 20, "US market"),
    exactCandidateFieldFit(candidate.currency, "USD", 15, "USD"),
    exactCandidateFieldFit(candidate.language, "EN", 10, "English"),
    sourceFeedTypeFit(candidate.sourceFeedType)
  ];
}

function productCountFit(
  productCount: number | null | undefined
): CandidateFitContribution {
  if (typeof productCount !== "number") {
    return NO_CANDIDATE_FIT;
  }

  return (
    PRODUCT_COUNT_FIT_TIERS.find((tier) => productCount >= tier.minimum) ??
    NO_CANDIDATE_FIT
  );
}

function exactCandidateFieldFit(
  value: string | null | undefined,
  expectedValue: string,
  points: number,
  reason: string
): CandidateFitContribution {
  return normalizeCandidateField(value) === expectedValue
    ? { points, reason }
    : NO_CANDIDATE_FIT;
}

function sourceFeedTypeFit(
  sourceFeedType: string | null | undefined
): CandidateFitContribution {
  return candidateFieldHasValue(sourceFeedType)
    ? { points: 5, reason: "feed type present" }
    : NO_CANDIDATE_FIT;
}

function normalizeCandidateField(value: string | null | undefined) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function candidateFieldHasValue(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}
