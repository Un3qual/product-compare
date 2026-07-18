import { Suspense } from "react";
import { Link, useLoaderData } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import offerDiscoveryRouteQuery, {
  type OfferDiscoveryRouteQuery
} from "../../__generated__/OfferDiscoveryRouteQuery.graphql";
import { useRoutePreloadedQuery } from "../../relay/route-preload";
import { ResettableErrorBoundary } from "../../relay/ResettableErrorBoundary";
import { FeedbackState } from "../../ui/components/feedback/FeedbackState";
import { ContextRail } from "../../ui/components/layout/ContextRail";
import { PageShell } from "../../ui/components/layout/PageShell";
import { WorkspaceLayout } from "../../ui/components/layout/WorkspaceLayout";
import { Button } from "../../ui/primitives/Button";
import {
  offerDiscoveryLoader,
  type OfferDiscoveryFilters,
  type OfferDiscoveryLoaderData
} from "./loader";
import {
  OfferDiscoveryFilterForm,
  OfferDiscoveryFilterSummary
} from "./OfferDiscoveryFilterForm";
import { offerDiscoverySelectedProductContext } from "./offer-discovery-filter-data";
import { OfferDiscoveryList } from "./OfferDiscoveryList";

export function OfferDiscoveryRoute() {
  const loaderData = useLoaderData<typeof offerDiscoveryLoader>() as OfferDiscoveryLoaderData;

  return (
    <PageShell
      description="Review current merchant prices, availability, recent observations, and coupon context for a selected product."
      eyebrow="Offer discovery"
      title="Offers"
    >
      <WorkspaceLayout
        context={
          <ContextRail
            description="Scope the product, merchant, availability, and ordering of the visible offers."
            label="Offer controls"
          >
            <OfferDiscoveryFilterForm filters={loaderData.filters} />
          </ContextRail>
        }
        label="Offer results"
      >
        {loaderData.status === "missingProduct" ? (
          <>
            <OfferDiscoveryFilterSummary filters={loaderData.filters} />
            <MissingProductState />
          </>
        ) : loaderData.status === "error" ? (
          <OfferDiscoveryQueryFallback filters={loaderData.filters} />
        ) : (
          <ResettableErrorBoundary
            fallback={<OfferDiscoveryQueryFallback filters={loaderData.filters} />}
            resetToken={loaderData.query}
          >
            <Suspense fallback={<OfferDiscoveryLoadingFallback filters={loaderData.filters} />}>
              <OfferDiscoveryPanel filters={loaderData.filters} query={loaderData.query} />
            </Suspense>
          </ResettableErrorBoundary>
        )}
      </WorkspaceLayout>
    </PageShell>
  );
}

function OfferDiscoveryPanel({
  filters,
  query
}: {
  filters: OfferDiscoveryFilters;
  query: Extract<OfferDiscoveryLoaderData, { status: "ready" }>["query"];
}) {
  const queryRef = useRoutePreloadedQuery<OfferDiscoveryRouteQuery>(
    offerDiscoveryRouteQuery,
    query
  );
  const data = usePreloadedQuery<OfferDiscoveryRouteQuery>(offerDiscoveryRouteQuery, queryRef);
  const selectedProduct = offerDiscoverySelectedProductContext(data.selectedProduct);

  return (
    <>
      <OfferDiscoveryFilterSummary filters={filters} selectedProduct={selectedProduct} />
      {data.merchantProducts ? (
        <OfferDiscoveryList connection={data.merchantProducts} filters={filters} />
      ) : (
        <FeedbackState kind="error" title="Offers unavailable." />
      )}
    </>
  );
}

function MissingProductState() {
  return (
    <FeedbackState
      action={
        <Button asChild variant="solid">
          <Link to="/products">Browse products</Link>
        </Button>
      }
      description="Choose a product to review its current merchant offers."
      kind="empty"
      title="Start from browse products to choose a product."
    />
  );
}

function OfferDiscoveryQueryFallback({ filters }: { filters: OfferDiscoveryFilters }) {
  return (
    <>
      <OfferDiscoveryFilterSummary filters={filters} />
      <FeedbackState kind="error" title="Offers unavailable." />
    </>
  );
}

function OfferDiscoveryLoadingFallback({ filters }: { filters: OfferDiscoveryFilters }) {
  return (
    <>
      <OfferDiscoveryFilterSummary filters={filters} />
      <FeedbackState kind="loading" title="Loading offers..." />
    </>
  );
}
