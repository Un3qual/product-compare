import { Suspense } from "react";
import { useLoaderData } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import merchantDirectoryRouteQuery, {
  type MerchantDirectoryRouteQuery
} from "../../__generated__/MerchantDirectoryRouteQuery.graphql";
import { useRoutePreloadedQuery } from "../../relay/route-preload";
import { ResettableErrorBoundary } from "../../relay/ResettableErrorBoundary";
import { FeedbackState } from "../../ui/components/feedback/FeedbackState";
import { ContextRail } from "../../ui/components/layout/ContextRail";
import { PageShell } from "../../ui/components/layout/PageShell";
import { WorkspaceLayout } from "../../ui/components/layout/WorkspaceLayout";
import { externalWebsiteHref } from "../external-links";
import {
  MerchantDirectoryControls,
  MerchantDirectoryView
} from "./MerchantDirectoryView";
import {
  merchantDirectoryLoader,
  type MerchantDirectoryLoaderData,
  type MerchantDirectoryPagination
} from "./loader";
import { buildMerchantDirectoryPaginationData } from "./pagination";

export function MerchantDirectoryRoute() {
  const loaderData = useLoaderData<typeof merchantDirectoryLoader>() as MerchantDirectoryLoaderData;

  return (
    <PageShell
      description="Browse the merchants represented in current product and offer data."
      eyebrow="Seller directory"
      title="Merchants"
    >
      <MerchantDirectoryContent loaderData={loaderData} />
    </PageShell>
  );
}

function MerchantDirectoryContent({
  loaderData
}: {
  loaderData: MerchantDirectoryLoaderData;
}) {
  return (
    <WorkspaceLayout
      context={
        <ContextRail
          description="Adjust how many merchants appear in the current result page."
          label="Merchant controls"
        >
          <MerchantDirectoryControls
            formAction="/merchants"
            pageSize={loaderData.pagination.first}
          />
        </ContextRail>
      }
      label="Merchant results"
    >
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
    </WorkspaceLayout>
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

  const paginationData = buildMerchantDirectoryPaginationData({
    endCursor: data.merchants.pageInfo.endCursor ?? null,
    hasNextPage: data.merchants.pageInfo.hasNextPage,
    hasPreviousPage: data.merchants.pageInfo.hasPreviousPage,
    pagination
  });

  return (
    <MerchantDirectoryView
      firstHref={paginationData.firstHref}
      merchants={data.merchants.edges.map(({ node }) => ({
        id: node.id,
        name: node.name,
        domain: node.domain,
        detailHref: `/merchants/${node.slug}`,
        websiteHref: externalWebsiteHref(node.domain)
      }))}
      nextHref={paginationData.nextHref}
    />
  );
}

function MerchantDirectoryUnavailableFallback() {
  return (
    <FeedbackState kind="error" title="Merchant directory unavailable." />
  );
}
