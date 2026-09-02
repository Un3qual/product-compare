import { Suspense, useMemo, useState } from "react";
import { useLoaderData } from "react-router";
import { graphql, usePreloadedQuery } from "react-relay";
import type { AffiliateSetupRouteQuery } from "$generated/AffiliateSetupRouteQuery.graphql";
import type { Route } from "./+types/AffiliateSetupRoute";
import { routeMetaDescriptors } from "$frontend/seo";
import { RouteErrorBoundary as SharedRouteErrorBoundary } from "$routes/compare/RouteErrorBoundary";
import {
  getRelayEnvironmentFromRouterContext,
  preloadRouteQuery,
  useRoutePreloadedQuery,
  type RelayRouteQueryDescriptor,
} from "$relay/route-preload";
import { ResettableErrorBoundary } from "$relay/ResettableErrorBoundary";
import { FeedbackState } from "$ui/components/feedback/FeedbackState";
import { ContextRail } from "$ui/components/layout/ContextRail";
import { PageShell } from "$ui/components/layout/PageShell";
import { WorkspaceLayout } from "$ui/components/layout/WorkspaceLayout";
import { Pagination } from "$ui/components/navigation/Pagination";
import { recoverRouteLoaderError } from "$relay/loader-errors";
import { merchantPaginationFromUrl, type MerchantPagination } from "../../merchants/pagination";
import { CouponStep } from "./coupon/CouponStep";
import { MerchantLinkStep } from "./merchant-link/MerchantLinkStep";
import { NetworkStep } from "./network/NetworkStep";
import { ProgramStep } from "./program/ProgramStep";
import { buildMerchantChoices, getAffiliateMerchantContext } from "./merchant-context";
import { buildAffiliateSetupPaginationData } from "./pagination";

export {
  AffiliateSetupRoute as default,
  affiliateSetupLoader as clientLoader,
  affiliateSetupLoader as loader,
};

export function meta() {
  return routeMetaDescriptors({
    title: "Affiliate setup | Product Compare",
    description: "Configure merchant affiliate programs used for outbound offer links.",
  });
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return (
    <SharedRouteErrorBoundary
      error={error}
      resourceName="affiliate setup"
      title="Affiliate setup"
    />
  );
}

const affiliateSetupRouteQuery = graphql`
  query AffiliateSetupRouteQuery($first: Int!, $after: String) {
    merchants(first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          name
          domain
          ...MerchantDirectoryView_item
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

export type AffiliateSetupLoaderData =
  | {
      status: "ready";
      merchantPagination: MerchantPagination;
      merchantQuery: RelayRouteQueryDescriptor<AffiliateSetupRouteQuery["variables"]>;
    }
  | {
      status: "error";
      merchantPagination: MerchantPagination;
    };

export async function affiliateSetupLoader({
  context,
  request,
}: Route.LoaderArgs): Promise<AffiliateSetupLoaderData> {
  const environment = getRelayEnvironmentFromRouterContext(context);
  const merchantPagination = merchantPaginationFromUrl(new URL(request.url));

  try {
    return {
      status: "ready",
      merchantPagination,
      merchantQuery: await preloadRouteQuery<AffiliateSetupRouteQuery>(
        environment,
        affiliateSetupRouteQuery,
        merchantPagination,
        { signal: request.signal },
      ),
    };
  } catch (error) {
    return recoverRouteLoaderError<AffiliateSetupLoaderData>(
      error,
      "Failed to preload affiliate setup merchant choices.",
      {
        status: "error",
        merchantPagination,
      },
    );
  }
}

export function AffiliateSetupRoute() {
  const loaderData = useLoaderData<typeof affiliateSetupLoader>();

  return (
    <PageShell
      description="Configure the networks, merchant programs, tracked links, and coupons that power affiliate commerce."
      eyebrow="Commerce operations"
      title="Affiliate setup"
    >
      {loaderData.status === "error" ? (
        <AffiliateSetupUnavailableFallback />
      ) : (
        <ResettableErrorBoundary
          fallback={<AffiliateSetupUnavailableFallback />}
          resetToken={loaderData.merchantQuery}
        >
          <Suspense fallback={<FeedbackState kind="loading" title="Loading affiliate setup..." />}>
            <AffiliateSetupPanel
              merchantPagination={loaderData.merchantPagination}
              merchantQuery={loaderData.merchantQuery}
            />
          </Suspense>
        </ResettableErrorBoundary>
      )}
    </PageShell>
  );
}

function AffiliateSetupPanel({
  merchantPagination,
  merchantQuery,
}: {
  merchantPagination: Extract<AffiliateSetupLoaderData, { status: "ready" }>["merchantPagination"];
  merchantQuery: Extract<AffiliateSetupLoaderData, { status: "ready" }>["merchantQuery"];
}) {
  const queryRef = useRoutePreloadedQuery<AffiliateSetupRouteQuery>(
    affiliateSetupRouteQuery,
    merchantQuery,
  );
  const data = usePreloadedQuery<AffiliateSetupRouteQuery>(affiliateSetupRouteQuery, queryRef);
  const [affiliateNetworkId, setAffiliateNetworkId] = useState("");
  const [selectedMerchantId, setSelectedMerchantId] = useState("");

  const merchantChoices = useMemo(() => buildMerchantChoices(data.merchants), [data.merchants]);
  const merchantContext = useMemo(
    () => getAffiliateMerchantContext(merchantChoices, selectedMerchantId),
    [merchantChoices, selectedMerchantId],
  );

  if (!data.merchants) {
    return <AffiliateSetupUnavailableFallback />;
  }

  const paginationData = buildAffiliateSetupPaginationData({
    endCursor: data.merchants.pageInfo.endCursor,
    hasNextPage: data.merchants.pageInfo.hasNextPage,
    hasPreviousPage: data.merchants.pageInfo.hasPreviousPage,
    pagination: merchantPagination,
  });

  return (
    <WorkspaceLayout
      context={
        <ContextRail
          description="Work from network identity through the merchant-facing assets that depend on it."
          label="Setup sequence"
        >
          <ol>
            <li>Save the affiliate network.</li>
            <li>Connect a merchant program.</li>
            <li>Register a tracked link.</li>
            <li>Add an eligible coupon.</li>
          </ol>
          {merchantContext.currentMerchantCopy ? (
            <p>{merchantContext.currentMerchantCopy}</p>
          ) : null}
        </ContextRail>
      }
      label="Affiliate configuration workflow"
    >
      <NetworkStep onNetworkIdChange={setAffiliateNetworkId} />

      {merchantChoices.length === 0 ? (
        <p role="status">No merchants available for affiliate setup yet.</p>
      ) : (
        <ProgramStep
          affiliateNetworkId={affiliateNetworkId}
          merchantChoices={merchantChoices}
          onAffiliateNetworkIdChange={setAffiliateNetworkId}
          onSelectedMerchantIdChange={setSelectedMerchantId}
          selectedMerchantCopy={merchantContext.selectedMerchantCopy}
          selectedMerchantValue={merchantContext.selectedMerchantValue}
        />
      )}

      <MerchantLinkStep selectedMerchantCopy={merchantContext.selectedMerchantCopy} />

      {merchantChoices.length === 0 ? null : (
        <CouponStep
          merchantChoices={merchantChoices}
          onSelectedMerchantIdChange={setSelectedMerchantId}
          selectedMerchantCopy={merchantContext.selectedMerchantCopy}
          selectedMerchantValue={merchantContext.selectedMerchantValue}
        />
      )}

      <Pagination
        firstHref={paginationData.firstHref}
        firstLabel="First merchants"
        label="Merchant choice pages"
        nextHref={paginationData.nextHref}
        nextLabel="Next merchants"
      />
    </WorkspaceLayout>
  );
}

function AffiliateSetupUnavailableFallback() {
  return (
    <section role="alert">
      <p>Affiliate setup unavailable.</p>
    </section>
  );
}
