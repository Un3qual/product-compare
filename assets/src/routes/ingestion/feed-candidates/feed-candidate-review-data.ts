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
  return (
    productCountFitPoints(candidate.productCount) +
    exactCandidateFieldPoints(candidate.advertiserCountry, "US", 20) +
    exactCandidateFieldPoints(candidate.currency, "USD", 15) +
    exactCandidateFieldPoints(candidate.language, "EN", 10) +
    sourceFeedTypeFitPoints(candidate.sourceFeedType)
  );
}

export function candidateFitReasons(candidate: FeedCandidateReviewData) {
  return [
    productCountFitReason(candidate.productCount),
    exactCandidateFieldReason(candidate.advertiserCountry, "US", "US market"),
    exactCandidateFieldReason(candidate.currency, "USD", "USD"),
    exactCandidateFieldReason(candidate.language, "EN", "English"),
    sourceFeedTypeFitReason(candidate.sourceFeedType)
  ].filter((reason): reason is string => typeof reason === "string");
}

export function formatFeedCandidateReviewStatus(reviewStatus: string | null | undefined) {
  switch (reviewStatus) {
    case "DISMISSED":
      return "Dismissed";
    case "SHORTLISTED":
      return "Shortlisted";
    case "PENDING":
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
  if (typeof value !== "string") {
    return "";
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "" : formatProductDateTime(date);
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

function productCountFitPoints(productCount: number | null | undefined) {
  if (typeof productCount !== "number") {
    return 0;
  }

  if (productCount >= 10000) {
    return 50;
  }

  if (productCount >= 1000) {
    return 35;
  }

  if (productCount >= 100) {
    return 20;
  }

  return productCount > 0 ? 10 : 0;
}

function productCountFitReason(productCount: number | null | undefined) {
  if (typeof productCount !== "number") {
    return null;
  }

  if (productCount >= 10000) {
    return "10000+ products";
  }

  if (productCount >= 1000) {
    return "1000+ products";
  }

  if (productCount >= 100) {
    return "100+ products";
  }

  return productCount > 0 ? "1+ products" : null;
}

function exactCandidateFieldPoints(
  value: string | null | undefined,
  expectedValue: string,
  points: number
) {
  return normalizeCandidateField(value) === expectedValue ? points : 0;
}

function exactCandidateFieldReason(
  value: string | null | undefined,
  expectedValue: string,
  reason: string
) {
  return normalizeCandidateField(value) === expectedValue ? reason : null;
}

function sourceFeedTypeFitPoints(sourceFeedType: string | null | undefined) {
  return candidateFieldHasValue(sourceFeedType) ? 5 : 0;
}

function sourceFeedTypeFitReason(sourceFeedType: string | null | undefined) {
  return candidateFieldHasValue(sourceFeedType) ? "feed type present" : null;
}

function normalizeCandidateField(value: string | null | undefined) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function candidateFieldHasValue(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}
