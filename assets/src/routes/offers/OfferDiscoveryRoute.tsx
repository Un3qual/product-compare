import { Suspense } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link, useLoaderData, type LoaderFunctionArgs } from "react-router-dom";
import { graphql, usePreloadedQuery } from "react-relay";
import type { OfferDiscoveryRouteQuery } from "$generated/OfferDiscoveryRouteQuery.graphql";
import { ResettableErrorBoundary } from "$relay/ResettableErrorBoundary";
import {
  getRelayEnvironmentFromRouterContext,
  preloadRouteQuery,
  useRoutePreloadedQuery,
  type RelayRouteQueryDescriptor,
} from "$relay/route-preload";
import { recoverRouteLoaderError } from "$routes/loader-errors";
import { FeedbackState } from "$ui/components/feedback/FeedbackState";
import { ContextRail } from "$ui/components/layout/ContextRail";
import { PageShell } from "$ui/components/layout/PageShell";
import { WorkspaceLayout } from "$ui/components/layout/WorkspaceLayout";
import { Button } from "$ui/primitives/Button";
import type { OfferDiscoveryFilters } from "./offer-discovery-filter-data";
import {
  offerDiscoveryFiltersFromUrl,
  offerDiscoveryInputFromFilters,
} from "./offer-discovery-filters";
import {
  MobileOfferDiscoveryFilters,
  OfferDiscoveryFilterForm,
  OfferDiscoveryFilterSummary,
} from "./OfferDiscoveryFilterForm";
import { offerDiscoverySelectedProductContext } from "./offer-discovery-filter-data";
import { OfferDiscoveryList } from "./OfferDiscoveryList";

const styles = create({
  desktopFilters: {
    display: { default: "block", "@media (max-width: 62rem)": "none" },
  },
});

const offerDiscoveryRouteQuery = graphql`
  query OfferDiscoveryRouteQuery(
    $after: String
    $first: Int!
    $input: MerchantProductsInput!
    $productId: ID!
  ) {
    selectedProduct: node(id: $productId) {
      __typename
      ... on Product {
        id
        name
        slug
        brand {
          id
          name
        }
      }
    }
    merchantProducts(after: $after, first: $first, input: $input) {
      ...OfferDiscoveryList_connection
    }
  }
`;

export type OfferDiscoveryLoaderData =
  | {
      status: "ready";
      filters: OfferDiscoveryFilters;
      query: RelayRouteQueryDescriptor<OfferDiscoveryRouteQuery["variables"]>;
    }
  | { status: "missingProduct"; filters: OfferDiscoveryFilters }
  | { status: "error"; filters: OfferDiscoveryFilters };

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
          <div {...props(styles.desktopFilters)}>
            <ContextRail
              description="Adjust availability, page size, ordering, and advanced product or merchant references."
              label="Refine offers"
            >
              <OfferDiscoveryFilterForm filters={loaderData.filters} />
            </ContextRail>
          </div>
        }
        label="Offer results"
      >
        {loaderData.status === "missingProduct" ? (
          <>
            <OfferDiscoveryFilterSummary filters={loaderData.filters} />
            <MobileOfferDiscoveryFilters filters={loaderData.filters} />
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
  query,
}: {
  filters: OfferDiscoveryFilters;
  query: Extract<OfferDiscoveryLoaderData, { status: "ready" }>["query"];
}) {
  const queryRef = useRoutePreloadedQuery<OfferDiscoveryRouteQuery>(
    offerDiscoveryRouteQuery,
    query,
  );
  const data = usePreloadedQuery<OfferDiscoveryRouteQuery>(offerDiscoveryRouteQuery, queryRef);
  const selectedProduct = offerDiscoverySelectedProductContext(data.selectedProduct);

  return (
    <>
      <OfferDiscoveryFilterSummary filters={filters} selectedProduct={selectedProduct} />
      <MobileOfferDiscoveryFilters filters={filters} />
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
      action={<Button render={<Link to="/products" />}>Browse products</Button>}
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
      <MobileOfferDiscoveryFilters filters={filters} />
      <FeedbackState kind="error" title="Offers unavailable." />
    </>
  );
}

function OfferDiscoveryLoadingFallback({ filters }: { filters: OfferDiscoveryFilters }) {
  return (
    <>
      <OfferDiscoveryFilterSummary filters={filters} />
      <MobileOfferDiscoveryFilters filters={filters} />
      <FeedbackState kind="loading" title="Loading offers..." />
    </>
  );
}

export async function offerDiscoveryLoader({
  context,
  request,
}: LoaderFunctionArgs): Promise<OfferDiscoveryLoaderData> {
  const environment = getRelayEnvironmentFromRouterContext(context);
  const filters = offerDiscoveryFiltersFromUrl(new URL(request.url));

  if (!filters.productId) return { status: "missingProduct", filters };

  try {
    return {
      status: "ready",
      filters,
      query: await preloadRouteQuery<OfferDiscoveryRouteQuery>(
        environment,
        offerDiscoveryRouteQuery,
        {
          after: filters.after,
          first: filters.first,
          input: offerDiscoveryInputFromFilters(filters),
          productId: filters.productId,
        },
        { signal: request.signal },
      ),
    };
  } catch (error) {
    return recoverRouteLoaderError<OfferDiscoveryLoaderData>(
      error,
      "Failed to preload offer discovery route query.",
      { status: "error", filters },
    );
  }
}
