import { Suspense, useState } from "react";
import { Link, useLoaderData } from "react-router-dom";
import { useMutation, usePreloadedQuery } from "react-relay";
import merchantFeedCandidatesRouteQuery, {
  type MerchantFeedCandidatesRouteQuery
} from "../../../__generated__/MerchantFeedCandidatesRouteQuery.graphql";
import reviewMerchantFeedCandidateMutation, {
  type ReviewMerchantFeedCandidateInput,
  type ReviewMerchantFeedCandidateMutation
} from "../../../__generated__/ReviewMerchantFeedCandidateMutation.graphql";
import { useRoutePreloadedQuery } from "../../../relay/route-preload";
import { ResettableErrorBoundary } from "../../../relay/resettable-error-boundary";
import {
  feedCandidatesLoader,
  type FeedCandidatesLoaderData
} from "./loader";
import type { FeedCandidatesPagination } from "./pagination";

type FeedCandidatesConnection = NonNullable<
  MerchantFeedCandidatesRouteQuery["response"]["merchantFeedCandidates"]
>;
type FeedCandidate = FeedCandidatesConnection["edges"][number]["node"];
type ReviewStatus = "PENDING" | "SHORTLISTED" | "DISMISSED";

export function FeedCandidatesRoute() {
  const loaderData = useLoaderData<typeof feedCandidatesLoader>() as FeedCandidatesLoaderData;

  return (
    <section>
      <header>
        <h1>CJ feed candidates</h1>
      </header>

      {loaderData.status === "error" ? (
        <FeedCandidatesUnavailableFallback />
      ) : (
        <ResettableErrorBoundary
          fallback={<FeedCandidatesUnavailableFallback />}
          resetToken={loaderData.query}
        >
          <Suspense fallback={<p role="status">Loading feed candidates...</p>}>
            <FeedCandidatesPanel
              pagination={loaderData.pagination}
              query={loaderData.query}
            />
          </Suspense>
        </ResettableErrorBoundary>
      )}
    </section>
  );
}

function FeedCandidatesPanel({
  pagination,
  query
}: {
  pagination: FeedCandidatesPagination;
  query: Extract<FeedCandidatesLoaderData, { status: "ready" }>["query"];
}) {
  const queryRef = useRoutePreloadedQuery<MerchantFeedCandidatesRouteQuery>(
    merchantFeedCandidatesRouteQuery,
    query
  );
  const data = usePreloadedQuery<MerchantFeedCandidatesRouteQuery>(
    merchantFeedCandidatesRouteQuery,
    queryRef
  );

  if (!data.merchantFeedCandidates) {
    return <FeedCandidatesUnavailableFallback />;
  }

  return (
    <FeedCandidatesList
      connection={data.merchantFeedCandidates}
      pagination={pagination}
    />
  );
}

function FeedCandidatesList({
  connection,
  pagination
}: {
  connection: FeedCandidatesConnection;
  pagination: FeedCandidatesPagination;
}) {
  const candidates = connection.edges.map(({ node }) => node);
  const reviewCounts = countByReviewStatus(candidates);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [commitReview, isReviewInFlight] =
    useMutation<ReviewMerchantFeedCandidateMutation>(
      reviewMerchantFeedCandidateMutation
    );

  const handleReviewNoteChange = (candidateId: string, note: string) => {
    setReviewNotes((currentReviewNotes) => ({
      ...currentReviewNotes,
      [candidateId]: note
    }));
  };

  const handleReview = (candidate: FeedCandidate, status: ReviewStatus) => {
    const note = (reviewNotes[candidate.id] ?? candidate.reviewNote ?? "").trim();
    const input: ReviewMerchantFeedCandidateInput =
      note.length > 0
        ? {
            id: candidate.id,
            status,
            note
          }
        : {
            id: candidate.id,
            status
          };

    setReviewFeedback("");
    commitReview({
      variables: {
        input
      },
      onCompleted(response) {
        const payload = response.reviewMerchantFeedCandidate;
        const errors = payload.errors ?? [];

        if (errors.length > 0) {
          setReviewFeedback(errors.map((error) => error.message).join(" "));
          return;
        }

        setReviewFeedback(
          `${formatCandidateName(candidate)} marked ${formatReviewStatus(
            payload.candidate?.reviewStatus ?? status
          )}.`
        );
      },
      onError() {
        setReviewFeedback("Feed candidate review status could not be updated.");
      }
    });
  };

  if (candidates.length === 0) {
    return <p>No CJ feed candidates captured yet.</p>;
  }

  return (
    <>
      <dl aria-label="CJ feed candidate review summary">
        <div>
          <dt>Pending</dt>
          <dd>{reviewCounts.pending}</dd>
        </div>
        <div>
          <dt>Shortlisted</dt>
          <dd>{reviewCounts.shortlisted}</dd>
        </div>
        <div>
          <dt>Dismissed</dt>
          <dd>{reviewCounts.dismissed}</dd>
        </div>
      </dl>
      <ul aria-label="CJ feed candidates">
        {candidates.map((candidate) => (
          <FeedCandidateListItem
            candidate={candidate}
            isReviewInFlight={isReviewInFlight}
            key={candidate.id}
            onReviewNoteChange={handleReviewNoteChange}
            onReview={handleReview}
            reviewNoteValue={reviewNotes[candidate.id] ?? candidate.reviewNote ?? ""}
          />
        ))}
      </ul>
      {reviewFeedback ? <p role="status">{reviewFeedback}</p> : null}
      {connection.pageInfo.hasPreviousPage && pagination.after ? (
        <p>
          <Link to="/ingestion/feed-candidates">First candidates</Link>
        </p>
      ) : null}
      {connection.pageInfo.hasNextPage && connection.pageInfo.endCursor ? (
        <p>
          <Link to={feedCandidatesNextPagePath(pagination, connection.pageInfo.endCursor)}>
            Next candidates
          </Link>
        </p>
      ) : null}
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
  const candidateName = formatCandidateName(candidate);
  const reviewedAt = formatReviewedAt(candidate.reviewedAt);

  return (
    <li>
      <h2>{candidateName}</h2>
      <p>{candidate.feedName ?? "Unnamed feed"}</p>
      <p>{formatProductCount(candidate.productCount)}</p>
      <p>{formatReviewStatus(candidate.reviewStatus)}</p>
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
      <div>
        <button
          aria-label={`Shortlist ${candidateName}`}
          disabled={isReviewInFlight}
          onClick={() => onReview(candidate, "SHORTLISTED")}
          type="button"
        >
          Shortlist
        </button>
        <button
          aria-label={`Dismiss ${candidateName}`}
          disabled={isReviewInFlight}
          onClick={() => onReview(candidate, "DISMISSED")}
          type="button"
        >
          Dismiss
        </button>
        <button
          aria-label={`Reset ${candidateName}`}
          disabled={isReviewInFlight}
          onClick={() => onReview(candidate, "PENDING")}
          type="button"
        >
          Reset
        </button>
      </div>
    </li>
  );
}

function FeedCandidatesUnavailableFallback() {
  return (
    <section role="alert">
      <p>Feed candidates unavailable.</p>
    </section>
  );
}

function feedCandidatesNextPagePath(
  pagination: FeedCandidatesPagination,
  endCursor: string
) {
  const params = new URLSearchParams();

  params.set("first", String(pagination.first));
  params.set("after", endCursor);

  return `/ingestion/feed-candidates?${params.toString()}`;
}

function formatProductCount(productCount: number | null | undefined) {
  if (typeof productCount !== "number") {
    return "Product count unavailable";
  }

  return productCount === 1 ? "1 product" : `${productCount} products`;
}

function formatCandidateName(candidate: FeedCandidate) {
  return candidate.advertiserName ?? candidate.providerFeedId;
}

function formatReviewStatus(reviewStatus: string | null | undefined) {
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

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}
