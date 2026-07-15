import type { ReactElement } from "react";
import { create, props } from "@stylexjs/stylex";
import type { MerchantFeedCandidatesRouteQuery } from "../../../__generated__/MerchantFeedCandidatesRouteQuery.graphql";
import { SummaryStrip } from "../../../ui/components/data/SummaryStrip";
import { Pagination } from "../../../ui/components/navigation/Pagination";
import { StatusBadge } from "../../../ui/components/status/StatusBadge";
import { Button } from "../../../ui/primitives/Button";
import { tokens } from "../../../ui/theme/tokens.stylex";
import {
  candidateFitReasons,
  candidateFitScore,
  countByReviewStatus,
  feedCandidatesFirstPagePath,
  feedCandidatesNextPagePath,
  formatFeedCandidateName,
  formatFeedCandidateReviewStatus,
  formatProductCount,
  formatReviewedAt,
  reviewStatusTone
} from "./feed-candidate-review-data";
import { type FeedCandidatesPagination } from "./pagination";

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
