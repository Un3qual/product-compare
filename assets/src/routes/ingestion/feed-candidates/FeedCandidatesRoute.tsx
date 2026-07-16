import { Suspense, useState } from "react";
import { create, props } from "@stylexjs/stylex";
import { useLoaderData, useRevalidator } from "react-router-dom";
import { useMutation, usePreloadedQuery } from "react-relay";
import merchantFeedCandidatesRouteQuery, {
  type MerchantFeedCandidatesRouteQuery
} from "../../../__generated__/MerchantFeedCandidatesRouteQuery.graphql";
import reviewMerchantFeedCandidateMutation, {
  type ReviewMerchantFeedCandidateMutation
} from "../../../__generated__/ReviewMerchantFeedCandidateMutation.graphql";
import { useRoutePreloadedQuery } from "../../../relay/route-preload";
import { ResettableErrorBoundary } from "../../../relay/ResettableErrorBoundary";
import { FeedbackState } from "../../../ui/components/feedback/FeedbackState";
import { ContextRail } from "../../../ui/components/layout/ContextRail";
import { PageShell } from "../../../ui/components/layout/PageShell";
import { WorkspaceLayout } from "../../../ui/components/layout/WorkspaceLayout";
import { Button } from "../../../ui/primitives/Button";
import { tokens } from "../../../ui/theme/tokens.stylex";
import {
  FeedCandidateReviewList,
  type FeedCandidate,
  type FeedCandidatesConnection
} from "./FeedCandidateReviewList";
import {
  formatFeedCandidateName,
  formatFeedCandidateReviewStatus
} from "./feed-candidate-review-data";
import {
  buildFeedCandidateReviewMutationInput,
  type FeedCandidateReviewStatus,
  omitReviewNoteDraft
} from "./feed-candidate-review-mutation-data";
import {
  feedCandidatesLoader,
  type FeedCandidatesLoaderData
} from "./loader";
import {
  feedCandidatesReviewStatusToUrlParam,
  feedCandidatesSortToUrlParam,
  type FeedCandidatesPagination
} from "./pagination";

const styles = create({
  controls: {
    alignItems: "end",
    backgroundColor: tokens.surfaceMuted,
    borderRadius: "var(--pc-radius-large)",
    display: "flex",
    flexWrap: "wrap",
    gap: "1rem",
    padding: "1rem"
  }
});

export function FeedCandidatesRoute() {
  const loaderData = useLoaderData<typeof feedCandidatesLoader>() as FeedCandidatesLoaderData;

  return (
    <PageShell
      description="Review merchant feed candidates with the fit, market, and review context needed to make a confident decision."
      eyebrow="Ingestion operations"
      title="CJ feed candidates"
    >
      <WorkspaceLayout
        context={
          <ContextRail
            description="Filter and order the queue while candidate evidence stays in view."
            label="Candidate controls"
          >
            <FeedCandidatesControls pagination={loaderData.pagination} />
          </ContextRail>
        }
        label="Feed candidate queue"
      >
        {loaderData.status === "error" ? (
          <FeedCandidatesUnavailableFallback />
        ) : (
          <ResettableErrorBoundary
            fallback={<FeedCandidatesUnavailableFallback />}
            resetToken={loaderData.query}
          >
            <Suspense fallback={<FeedbackState kind="loading" title="Loading feed candidates..." />}>
              <FeedCandidatesPanel
                pagination={loaderData.pagination}
                query={loaderData.query}
              />
            </Suspense>
          </ResettableErrorBoundary>
        )}
      </WorkspaceLayout>
    </PageShell>
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
      {...props(styles.controls)}
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
      <Button type="submit">Apply</Button>
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
    <FeedCandidateReviewPanel
      connection={data.merchantFeedCandidates}
      pagination={pagination}
    />
  );
}

function FeedCandidateReviewPanel({
  connection,
  pagination
}: {
  connection: FeedCandidatesConnection;
  pagination: FeedCandidatesPagination;
}) {
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

  const handleReview = (candidate: FeedCandidate, status: FeedCandidateReviewStatus) => {
    const input = buildFeedCandidateReviewMutationInput(
      candidate,
      status,
      reviewNotes
    );

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
          `${formatFeedCandidateName(candidate)} marked ${formatFeedCandidateReviewStatus(
            payload.candidate?.reviewStatus ?? status
          )}.`
        );
      },
      onError() {
        setReviewFeedback("Feed candidate review status could not be updated.");
      }
    });
  };

  return (
    <FeedCandidateReviewList
      connection={connection}
      isReviewInFlight={isReviewInFlight}
      onReview={handleReview}
      onReviewNoteChange={handleReviewNoteChange}
      pagination={pagination}
      reviewFeedback={reviewFeedback}
      reviewNotes={reviewNotes}
    />
  );
}

function FeedCandidatesUnavailableFallback() {
  return (
    <section role="alert">
      <p>Feed candidates unavailable.</p>
    </section>
  );
}
