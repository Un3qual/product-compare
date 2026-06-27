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
import { merchantDirectoryPagePath } from "./pagination";

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
        <>
          <MerchantDirectoryControls pagination={loaderData.pagination} />
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
        </>
      )}
    </section>
  );
}

function MerchantDirectoryControls({
  pagination
}: {
  pagination: MerchantDirectoryPagination;
}) {
  return (
    <form action="/merchants" method="get">
      <label>
        Page size
        <select name="first" defaultValue={String(pagination.first)}>
          <option value="20">20</option>
          <option value="35">35</option>
          <option value="50">50</option>
        </select>
      </label>
      <button type="submit">Apply</button>
    </form>
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
      {connection.pageInfo.hasPreviousPage && pagination.after ? (
        <p>
          <Link to={merchantDirectoryPagePath(pagination)}>First merchants</Link>
        </p>
      ) : null}
      {connection.pageInfo.hasNextPage && connection.pageInfo.endCursor ? (
        <p>
          <Link to={merchantDirectoryPagePath(pagination, connection.pageInfo.endCursor)}>
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
