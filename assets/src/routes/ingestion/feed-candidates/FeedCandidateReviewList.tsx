import type { ReactElement } from "react";
import { create, props } from "@stylexjs/stylex";
import type { MerchantFeedCandidatesRouteQuery } from "../../../__generated__/MerchantFeedCandidatesRouteQuery.graphql";
import { SummaryStrip } from "../../../ui/components/data/SummaryStrip";
import { Pagination } from "../../../ui/components/navigation/Pagination";
import { StatusBadge } from "../../../ui/components/status/StatusBadge";
import { Button } from "../../../ui/primitives/Button";
import { tokens } from "../../../ui/theme/tokens.stylex";
import { formatProductDateTime } from "../../product-formatting";
import {
  feedCandidatesReviewStatusToUrlParam,
  feedCandidatesSortToUrlParam,
  type FeedCandidatesPagination
} from "./pagination";

export type FeedCandidatesConnection = NonNullable<
  MerchantFeedCandidatesRouteQuery["response"]["merchantFeedCandidates"]
>;
export type FeedCandidate = FeedCandidatesConnection["edges"][number]["node"];
export type ReviewStatus = "PENDING" | "SHORTLISTED" | "DISMISSED";

const styles = create({
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0
  },
  item: {
    borderBlockEndColor: tokens.borderQuiet,
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "1px",
    display: "grid",
    gap: "0.65rem",
    paddingBlock: "1.25rem"
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.65rem"
  }
});

export function FeedCandidateReviewList({
  connection,
  isReviewInFlight,
  onReview,
  onReviewNoteChange,
  pagination,
  reviewFeedback,
  reviewNotes
}: {
  connection: FeedCandidatesConnection;
  isReviewInFlight: boolean;
  onReview: (candidate: FeedCandidate, status: ReviewStatus) => void;
  onReviewNoteChange: (candidateId: string, note: string) => void;
  pagination: FeedCandidatesPagination;
  reviewFeedback: string;
  reviewNotes: Readonly<Record<string, string>>;
}): ReactElement {
  const candidates = connection.edges.map(({ node }) => node);
  const reviewCounts = countByReviewStatus(candidates);

  if (candidates.length === 0) {
    return <p>No CJ feed candidates captured yet.</p>;
  }

  return (
    <>
      <SummaryStrip
        items={[
          { label: "Pending", value: reviewCounts.pending },
          { label: "Shortlisted", value: reviewCounts.shortlisted },
          { label: "Dismissed", value: reviewCounts.dismissed }
        ]}
        label="CJ feed candidate review summary"
      />
      <ul aria-label="CJ feed candidates" {...props(styles.list)}>
        {candidates.map((candidate) => (
          <FeedCandidateListItem
            candidate={candidate}
            isReviewInFlight={isReviewInFlight}
            key={candidate.id}
            onReviewNoteChange={onReviewNoteChange}
            onReview={onReview}
            reviewNoteValue={reviewNotes[candidate.id] ?? candidate.reviewNote ?? ""}
          />
        ))}
      </ul>
      {reviewFeedback ? <p role="status">{reviewFeedback}</p> : null}
      <Pagination
        firstHref={
          connection.pageInfo.hasPreviousPage && pagination.after
            ? feedCandidatesFirstPagePath(pagination)
            : null
        }
        firstLabel="First candidates"
        label="Feed candidate pages"
        nextHref={
          connection.pageInfo.hasNextPage && connection.pageInfo.endCursor
            ? feedCandidatesNextPagePath(pagination, connection.pageInfo.endCursor)
            : null
        }
        nextLabel="Next candidates"
      />
    </>
  );
}

function FeedCandidateListItem({
  candidate,
  isReviewInFlight,
  onReviewNoteChange,
  reviewNoteValue,
  onReview
}: {
  candidate: FeedCandidate;
  isReviewInFlight: boolean;
  onReviewNoteChange: (candidateId: string, note: string) => void;
  onReview: (candidate: FeedCandidate, status: ReviewStatus) => void;
  reviewNoteValue: string;
}) {
  const candidateName = formatFeedCandidateName(candidate);
  const reviewedAt = formatReviewedAt(candidate.reviewedAt);
  const fitScore = candidateFitScore(candidate);
  const fitReasons = candidateFitReasons(candidate);

  return (
    <li {...props(styles.item)}>
      <h2>{candidateName}</h2>
      <p>{candidate.feedName ?? "Unnamed feed"}</p>
      <p>{formatProductCount(candidate.productCount)}</p>
      <p>{`Fit score ${fitScore}`}</p>
      {fitReasons.length > 0 ? (
        <ul aria-label={`Fit reasons for ${candidateName}`}>
          {fitReasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : null}
      <StatusBadge tone={reviewStatusTone(candidate.reviewStatus)}>
        {formatFeedCandidateReviewStatus(candidate.reviewStatus)}
      </StatusBadge>
      <dl>
        {candidate.advertiserCountry ? (
          <>
            <dt>Country</dt>
            <dd>{candidate.advertiserCountry}</dd>
          </>
        ) : null}
        {candidate.currency ? (
          <>
            <dt>Currency</dt>
            <dd>{candidate.currency}</dd>
          </>
        ) : null}
        {candidate.language ? (
          <>
            <dt>Language</dt>
            <dd>{candidate.language}</dd>
          </>
        ) : null}
      </dl>
      {candidate.reviewNote ? <p>{candidate.reviewNote}</p> : null}
      {reviewedAt ? <p>Reviewed {reviewedAt}</p> : null}
      <label>
        Review note for {candidateName}
        <textarea
          onChange={(event) => onReviewNoteChange(candidate.id, event.currentTarget.value)}
          value={reviewNoteValue}
        />
      </label>
      <div {...props(styles.actions)}>
        <Button
          aria-label={`Shortlist ${candidateName}`}
          disabled={isReviewInFlight}
          onClick={() => onReview(candidate, "SHORTLISTED")}
          type="button"
        >
          Shortlist
        </Button>
        <Button
          aria-label={`Dismiss ${candidateName}`}
          disabled={isReviewInFlight}
          onClick={() => onReview(candidate, "DISMISSED")}
          tone="danger"
          type="button"
        >
          Dismiss
        </Button>
        <Button
          variant="soft"
          aria-label={`Reset ${candidateName}`}
          disabled={isReviewInFlight}
          onClick={() => onReview(candidate, "PENDING")}
          type="button"
        >
          Reset
        </Button>
      </div>
    </li>
  );
}

function feedCandidatesNextPagePath(
  pagination: FeedCandidatesPagination,
  endCursor: string
) {
  const params = new URLSearchParams();

  params.set("first", String(pagination.first));
  params.set("after", endCursor);
  appendFeedCandidatesFilterParams(params, pagination);

  return `/ingestion/feed-candidates?${params.toString()}`;
}

function feedCandidatesFirstPagePath(pagination: FeedCandidatesPagination) {
  const params = new URLSearchParams();

  params.set("first", String(pagination.first));
  appendFeedCandidatesFilterParams(params, pagination);

  return `/ingestion/feed-candidates?${params.toString()}`;
}

function appendFeedCandidatesFilterParams(
  params: URLSearchParams,
  pagination: FeedCandidatesPagination
) {
  const reviewStatus = feedCandidatesReviewStatusToUrlParam(pagination.reviewStatus);

  if (reviewStatus) {
    params.set("reviewStatus", reviewStatus);
  }

  params.set("sort", feedCandidatesSortToUrlParam(pagination.sort));
}

function candidateFitScore(candidate: FeedCandidate) {
  return (
    productCountFitPoints(candidate.productCount) +
    exactCandidateFieldPoints(candidate.advertiserCountry, "US", 20) +
    exactCandidateFieldPoints(candidate.currency, "USD", 15) +
    exactCandidateFieldPoints(candidate.language, "EN", 10) +
    sourceFeedTypeFitPoints(candidate.sourceFeedType)
  );
}

function candidateFitReasons(candidate: FeedCandidate) {
  return [
    productCountFitReason(candidate.productCount),
    exactCandidateFieldReason(candidate.advertiserCountry, "US", "US market"),
    exactCandidateFieldReason(candidate.currency, "USD", "USD"),
    exactCandidateFieldReason(candidate.language, "EN", "English"),
    sourceFeedTypeFitReason(candidate.sourceFeedType)
  ].filter((reason): reason is string => typeof reason === "string");
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

  if (productCount > 0) {
    return 10;
  }

  return 0;
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

  if (productCount > 0) {
    return "1+ products";
  }

  return null;
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

function formatProductCount(productCount: number | null | undefined) {
  if (typeof productCount !== "number") {
    return "Product count unavailable";
  }

  return productCount === 1 ? "1 product" : `${productCount} products`;
}

export function formatFeedCandidateName(candidate: Pick<FeedCandidate, "advertiserName" | "providerFeedId">) {
  return candidate.advertiserName ?? candidate.providerFeedId;
}

export function formatFeedCandidateReviewStatus(reviewStatus: string | null | undefined) {
  switch (reviewStatus) {
    case "DISMISSED":
      return "Dismissed";
    case "SHORTLISTED":
      return "Shortlisted";
    case "PENDING":
      return "Pending";
    default:
      return "Pending";
  }
}

function reviewStatusTone(reviewStatus: string | null | undefined) {
  if (reviewStatus === "SHORTLISTED") {
    return "positive" as const;
  }

  if (reviewStatus === "DISMISSED") {
    return "neutral" as const;
  }

  return "warning" as const;
}

function countByReviewStatus(candidates: ReadonlyArray<FeedCandidate>) {
  return candidates.reduce(
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

function formatReviewedAt(value: string | null | undefined) {
  if (typeof value !== "string") {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return formatProductDateTime(date);
}
