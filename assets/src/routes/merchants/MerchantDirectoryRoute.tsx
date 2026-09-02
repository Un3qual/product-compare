import { Suspense } from "react";
import { useLoaderData } from "react-router";
import { graphql, usePreloadedQuery } from "react-relay";
import type { MerchantDirectoryRouteQuery } from "$generated/MerchantDirectoryRouteQuery.graphql";
import type { Route } from "./+types/MerchantDirectoryRoute";
import { staticRouteMetaDescriptors } from "$frontend/seo";
import { RouteErrorBoundary as SharedRouteErrorBoundary } from "$routes/compare/RouteErrorBoundary";
import { ResettableErrorBoundary } from "$relay/ResettableErrorBoundary";
import {
  getRelayEnvironmentFromRouterContext,
  preloadRouteQuery,
  useRoutePreloadedQuery,
  type RelayRouteQueryDescriptor,
} from "$relay/route-preload";
import { recoverRouteLoaderError } from "$relay/loader-errors";
import { FeedbackState } from "$ui/components/feedback/FeedbackState";
import { ContextRail } from "$ui/components/layout/ContextRail";
import { PageShell } from "$ui/components/layout/PageShell";
import { WorkspaceLayout } from "$ui/components/layout/WorkspaceLayout";
import { MerchantDirectoryControls, MerchantDirectoryView } from "./MerchantDirectoryView";

export {
  MerchantDirectoryRoute as default,
  merchantDirectoryLoader as clientLoader,
  merchantDirectoryLoader as loader,
};

export function meta() {
  return staticRouteMetaDescriptors({
    title: "Merchants",
    description: "Browse merchants represented in current Product Compare offers.",
  });
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return (
    <SharedRouteErrorBoundary error={error} resourceName="merchant directory" title="Merchants" />
  );
}
import {
  buildMerchantDirectoryPaginationData,
  merchantPaginationFromUrl,
  type MerchantPagination,
} from "./pagination";

const merchantDirectoryRouteQuery = graphql`
  query MerchantDirectoryRouteQuery($first: Int!, $after: String) {
    merchants(first: $first, after: $after) {
      ...MerchantDirectoryView_merchants
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

export function MerchantDirectoryRoute() {
  const loaderData = useLoaderData<typeof merchantDirectoryLoader>();

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
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof merchantDirectoryLoader>>;
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
            <MerchantDirectoryPanel pagination={loaderData.pagination} query={loaderData.query} />
          </Suspense>
        </ResettableErrorBoundary>
      )}
    </WorkspaceLayout>
  );
}

function MerchantDirectoryPanel({
  pagination,
  query,
}: {
  pagination: MerchantPagination;
  query: RelayRouteQueryDescriptor<MerchantDirectoryRouteQuery["variables"]>;
}) {
  const queryRef = useRoutePreloadedQuery<MerchantDirectoryRouteQuery>(
    merchantDirectoryRouteQuery,
    query,
  );
  const data = usePreloadedQuery<MerchantDirectoryRouteQuery>(
    merchantDirectoryRouteQuery,
    queryRef,
  );

  if (!data.merchants) {
    return <MerchantDirectoryUnavailableFallback />;
  }

  const paginationData = buildMerchantDirectoryPaginationData({
    endCursor: data.merchants.pageInfo.endCursor,
    hasNextPage: data.merchants.pageInfo.hasNextPage,
    hasPreviousPage: data.merchants.pageInfo.hasPreviousPage,
    pagination,
  });

  return (
    <MerchantDirectoryView
      firstHref={paginationData.firstHref}
      merchants={data.merchants}
      nextHref={paginationData.nextHref}
    />
  );
}

function MerchantDirectoryUnavailableFallback() {
  return <FeedbackState kind="error" title="Merchant directory unavailable." />;
}

export async function merchantDirectoryLoader({
  context,
  request,
}: Route.LoaderArgs) {
  const environment = getRelayEnvironmentFromRouterContext(context);
  const pagination = merchantPaginationFromUrl(new URL(request.url));

  try {
    return {
      status: "ready" as const,
      pagination,
      query: await preloadRouteQuery<MerchantDirectoryRouteQuery>(
        environment,
        merchantDirectoryRouteQuery,
        pagination,
        { signal: request.signal },
      ),
    };
  } catch (error) {
    return recoverRouteLoaderError(error, "Failed to preload merchant directory route query.", {
      status: "error" as const,
      pagination,
    });
  }
}
