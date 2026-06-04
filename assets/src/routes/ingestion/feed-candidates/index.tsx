import { Suspense } from "react";
import { Link, useLoaderData } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import merchantFeedCandidatesRouteQuery, {
  type MerchantFeedCandidatesRouteQuery
} from "../../../__generated__/MerchantFeedCandidatesRouteQuery.graphql";
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

  if (candidates.length === 0) {
    return <p>No CJ feed candidates captured yet.</p>;
  }

  return (
    <>
      <ul aria-label="CJ feed candidates">
        {candidates.map((candidate) => (
          <FeedCandidateListItem candidate={candidate} key={candidate.id} />
        ))}
      </ul>
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

function FeedCandidateListItem({ candidate }: { candidate: FeedCandidate }) {
  return (
    <li>
      <h2>{candidate.advertiserName ?? candidate.providerFeedId}</h2>
      <p>{candidate.feedName ?? "Unnamed feed"}</p>
      <p>{formatProductCount(candidate.productCount)}</p>
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
