import { Suspense } from "react";
import { useLoaderData } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import merchantDirectoryRouteQuery, {
  type MerchantDirectoryRouteQuery
} from "../../__generated__/MerchantDirectoryRouteQuery.graphql";
import { useRoutePreloadedQuery } from "../../relay/route-preload";
import { ResettableErrorBoundary } from "../../relay/ResettableErrorBoundary";
import { FeedbackState } from "../../ui/components/feedback/FeedbackState";
import { PageShell } from "../../ui/components/layout/PageShell";
import { externalWebsiteHref } from "../external-links";
import { MerchantDirectoryView } from "./MerchantDirectoryView";
import {
  merchantDirectoryLoader,
  type MerchantDirectoryLoaderData,
  type MerchantDirectoryPagination
} from "./loader";
import { merchantDirectoryPagePath } from "./pagination";

export function MerchantDirectoryRoute() {
  const loaderData = useLoaderData<typeof merchantDirectoryLoader>() as MerchantDirectoryLoaderData;

  return (
    <PageShell
      description="Browse the merchants represented in current product and offer data."
      eyebrow="Seller directory"
      title="Merchants"
    >
      {loaderData.status === "error" ? (
        <MerchantDirectoryUnavailableFallback />
      ) : (
        <MerchantDirectoryContent loaderData={loaderData} />
      )}
    </PageShell>
  );
}

function MerchantDirectoryContent({
  loaderData
}: {
  loaderData: Extract<MerchantDirectoryLoaderData, { status: "ready" }>;
}) {
  return (
    <ResettableErrorBoundary
      fallback={<MerchantDirectoryUnavailableFallback />}
      resetToken={loaderData.query}
    >
      <Suspense fallback={<p role="status">Loading merchants...</p>}>
        <MerchantDirectoryPanel pagination={loaderData.pagination} query={loaderData.query} />
      </Suspense>
    </ResettableErrorBoundary>
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

  return (
    <MerchantDirectoryView
      firstHref={
        data.merchants.pageInfo.hasPreviousPage && pagination.after
          ? merchantDirectoryPagePath(pagination)
          : null
      }
      formAction="/merchants"
      merchants={data.merchants.edges.map(({ node }) => ({
        id: node.id,
        name: node.name,
        domain: node.domain,
        websiteHref: externalWebsiteHref(node.domain)
      }))}
      nextHref={
        data.merchants.pageInfo.hasNextPage && data.merchants.pageInfo.endCursor
          ? merchantDirectoryPagePath(pagination, data.merchants.pageInfo.endCursor)
          : null
      }
      pagination={pagination}
    />
  );
}

function MerchantDirectoryUnavailableFallback() {
  return (
    <FeedbackState kind="error" title="Merchant directory unavailable." />
  );
}
