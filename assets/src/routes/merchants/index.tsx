import { Suspense } from "react";
import { Link, useLoaderData } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import merchantDirectoryRouteQuery, {
  type MerchantDirectoryRouteQuery
} from "../../__generated__/MerchantDirectoryRouteQuery.graphql";
import { useRoutePreloadedQuery } from "../../relay/route-preload";
import { ResettableErrorBoundary } from "../../relay/resettable-error-boundary";
import {
  merchantDirectoryLoader,
  type MerchantDirectoryLoaderData,
  type MerchantDirectoryPagination
} from "./loader";

type MerchantDirectoryConnection = NonNullable<
  MerchantDirectoryRouteQuery["response"]["merchants"]
>;

export function MerchantDirectoryRoute() {
  const loaderData = useLoaderData<typeof merchantDirectoryLoader>() as MerchantDirectoryLoaderData;

  return (
    <section>
      <header>
        <h1>Merchants</h1>
      </header>

      {loaderData.status === "error" ? (
        <MerchantDirectoryUnavailableFallback />
      ) : (
        <ResettableErrorBoundary
          fallback={<MerchantDirectoryUnavailableFallback />}
          resetToken={loaderData.query}
        >
          <Suspense fallback={<p role="status">Loading merchants...</p>}>
            <MerchantDirectoryPanel
              pagination={loaderData.pagination}
              query={loaderData.query}
            />
          </Suspense>
        </ResettableErrorBoundary>
      )}
    </section>
  );
}

function MerchantDirectoryPanel({
  pagination,
  query
}: {
  pagination: MerchantDirectoryPagination;
  query: Extract<MerchantDirectoryLoaderData, { status: "ready" }>["query"];
}) {
  const queryRef = useRoutePreloadedQuery<MerchantDirectoryRouteQuery>(
    merchantDirectoryRouteQuery,
    query
  );
  const data = usePreloadedQuery<MerchantDirectoryRouteQuery>(
    merchantDirectoryRouteQuery,
    queryRef
  );

  if (!data.merchants) {
    return <MerchantDirectoryUnavailableFallback />;
  }

  return <MerchantDirectoryList connection={data.merchants} pagination={pagination} />;
}

function MerchantDirectoryList({
  connection,
  pagination
}: {
  connection: MerchantDirectoryConnection;
  pagination: MerchantDirectoryPagination;
}) {
  const merchants = connection.edges.map(({ node }) => node);

  if (merchants.length === 0) {
    return <p>No merchants available yet.</p>;
  }

  return (
    <>
      <ul aria-label="Merchants">
        {merchants.map((merchant) => (
          <li key={merchant.id}>
            <h2>{merchant.name}</h2>
            <p>{merchant.domain}</p>
          </li>
        ))}
      </ul>
      {connection.pageInfo.hasNextPage && connection.pageInfo.endCursor ? (
        <p>
          <Link to={merchantDirectoryNextPagePath(pagination, connection.pageInfo.endCursor)}>
            Next merchants
          </Link>
        </p>
      ) : null}
    </>
  );
}

function MerchantDirectoryUnavailableFallback() {
  return (
    <section role="alert">
      <p>Merchant directory unavailable.</p>
    </section>
  );
}

function merchantDirectoryNextPagePath(
  pagination: MerchantDirectoryPagination,
  endCursor: string
) {
  const params = new URLSearchParams();

  params.set("first", String(pagination.first));
  params.set("after", endCursor);

  return `/merchants?${params.toString()}`;
}
