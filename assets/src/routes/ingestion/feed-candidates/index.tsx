import { Suspense, useState } from "react";
import { Link, useLoaderData, useRevalidator } from "react-router-dom";
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
import {
  feedCandidatesReviewStatusToUrlParam,
  feedCandidatesSortToUrlParam,
  type FeedCandidatesPagination
} from "./pagination";

type FeedCandidatesConnection = NonNullable<
  MerchantFeedCandidatesRouteQuery["response"]["merchantFeedCandidates"]
>;
type FeedCandidate = FeedCandidatesConnection["edges"][number]["node"];
type ReviewStatus = "PENDING" | "SHORTLISTED" | "DISMISSED";

const reviewedAtFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short"
});

export function FeedCandidatesRoute() {
  const loaderData = useLoaderData<typeof feedCandidatesLoader>() as FeedCandidatesLoaderData;

  return (
    <section>
      <header>
        <h1>CJ feed candidates</h1>
      </header>
      <FeedCandidatesControls pagination={loaderData.pagination} />

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

function FeedCandidatesControls({
  pagination
}: {
  pagination: FeedCandidatesPagination;
}) {
  const reviewStatusParam =
    feedCandidatesReviewStatusToUrlParam(pagination.reviewStatus) ?? "";
  const sortParam = feedCandidatesSortToUrlParam(pagination.sort);

  return (
    <form
      action="/ingestion/feed-candidates"
      key={`${pagination.first}:${reviewStatusParam}:${sortParam}`}
      method="get"
    >
      <input name="first" type="hidden" value={pagination.first} />
      <label>
        Review status
        <select
          defaultValue={reviewStatusParam}
          name="reviewStatus"
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </label>
      <label>
        Sort candidates
        <select
          defaultValue={sortParam}
          name="sort"
        >
          <option value="name_asc">Name</option>
          <option value="fit_score_desc">Fit score</option>
          <option value="product_count_desc">Product count</option>
          <option value="last_seen_desc">Last seen</option>
        </select>
      </label>
      <button type="submit">Apply</button>
    </form>
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
  const revalidator = useRevalidator();
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
    const hasDraftNote = hasReviewNoteDraft(reviewNotes, candidate.id);
    const note = (hasDraftNote ? reviewNotes[candidate.id] : candidate.reviewNote ?? "").trim();
    const input: ReviewMerchantFeedCandidateInput =
      hasDraftNote || note.length > 0
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

        setReviewNotes((currentReviewNotes) =>
          omitReviewNoteDraft(currentReviewNotes, candidate.id)
        );
        revalidator.revalidate();
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
          <Link to={feedCandidatesFirstPagePath(pagination)}>First candidates</Link>
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
  const fitScore = candidateFitScore(candidate);
  const fitReasons = candidateFitReasons(candidate);

  return (
    <li>
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

function hasReviewNoteDraft(reviewNotes: Record<string, string>, candidateId: string) {
  return Object.prototype.hasOwnProperty.call(reviewNotes, candidateId);
}

function omitReviewNoteDraft(reviewNotes: Record<string, string>, candidateId: string) {
  return Object.fromEntries(
    Object.entries(reviewNotes).filter(([id]) => id !== candidateId)
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

  return reviewedAtFormatter.format(date);
}
