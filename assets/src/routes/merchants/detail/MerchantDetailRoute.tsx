import { create, props } from "@stylexjs/stylex";
import { data, Link, useLoaderData } from "react-router";
import { graphql, usePreloadedQuery } from "react-relay";
import type { MerchantDetailRouteQuery as MerchantDetailRouteQueryType } from "$generated/MerchantDetailRouteQuery.graphql";
import type { Route } from "./+types/MerchantDetailRoute";
import {
  fetchRouteQuery,
  getRelayEnvironmentFromRouterContext,
  useRoutePreloadedQuery,
  type RelayRouteQueryDescriptor,
} from "$relay/route-preload";
import { normalizeRouteLoaderThrownError } from "$relay/loader-errors";
import {
  routeMetadataFromSeo,
  routeMetaDescriptors,
  type RouteDocumentMetadata,
} from "$frontend/seo";
import { RouteErrorBoundary as SharedRouteErrorBoundary } from "$routes/compare/RouteErrorBoundary";
import { SummaryStrip } from "$ui/components/data/SummaryStrip";
import { FeedbackState } from "$ui/components/feedback/FeedbackState";
import { PageShell } from "$ui/components/layout/PageShell";
import { externalWebsiteHref } from "$frontend/navigation/external-links";
import { formatProductDateLabel } from "$frontend/formatting";
import { getMerchantDetailViewData } from "./merchant-detail-view-data";

export {
  MerchantDetailRoute as default,
  merchantDetailLoader as clientLoader,
  merchantDetailLoader as loader,
};

const merchantDetailRouteQuery = graphql`
  query MerchantDetailRouteQuery($slug: String!, $first: Int!, $after: String) {
    merchant(slug: $slug) {
      id
      name
      slug
      domain
      seo {
        title
        description
        canonicalPath
        indexable
        imageUrl
        structuredData
      }
      detailSummary {
        activeOfferCount
        distinctProductCount
        observedOfferCount
        eligibleOfferCount
        freshOfferCount
        agingOfferCount
        staleOfferCount
        unobservedOfferCount
        lastObservedAt
      }
      merchantProducts(first: $first, after: $after) {
        edges {
          node {
            id
            currency
            product {
              id
              name
              slug
            }
            latestPrice {
              id
              price
              shipping
              inStock
              observedAt
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

export type MerchantDetailLoaderData =
  | {
      status: "ready";
      metadata: RouteDocumentMetadata;
      query: RelayRouteQueryDescriptor<MerchantDetailRouteQueryType["variables"]>;
    }
  | { status: "not_found" };

export function meta({ loaderData }: Route.MetaArgs) {
  return routeMetaDescriptors(
    loaderData?.status === "ready"
      ? loaderData.metadata
      : {
          title: "Merchant details | Product Compare",
          description: "Review a merchant's current product and offer details.",
        },
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return (
    <SharedRouteErrorBoundary error={error} resourceName="merchant" title="Merchant details" />
  );
}

const styles = create({
  list: { display: "grid", gap: "1rem", listStyle: "none", margin: 0, padding: 0 },
  offer: {
    borderBlockStart: "1px solid var(--pc-border-quiet)",
    display: "grid",
    gap: "0.45rem",
    paddingBlockStart: "1rem",
  },
  secondary: { color: "var(--pc-text-secondary)", margin: 0 },
});

export function MerchantDetailRoute() {
  const loaderData = useLoaderData<typeof merchantDetailLoader>();
  if (loaderData.status !== "ready")
    return (
      <PageShell eyebrow="Seller detail" title="Merchant not found">
        <FeedbackState kind="error" title="This merchant is unavailable." />
      </PageShell>
    );

  return <ReadyMerchantDetail query={loaderData.query} />;
}

function ReadyMerchantDetail({
  query,
}: {
  query: Extract<MerchantDetailLoaderData, { status: "ready" }>["query"];
}) {
  const queryRef = useRoutePreloadedQuery<MerchantDetailRouteQueryType>(
    merchantDetailRouteQuery,
    query,
  );
  const data = usePreloadedQuery<MerchantDetailRouteQueryType>(merchantDetailRouteQuery, queryRef);
  const merchant = data.merchant;
  if (!merchant) return null;
  const websiteHref = externalWebsiteHref(merchant.domain);
  const viewData = getMerchantDetailViewData(merchant, query.__relayQuery.variables.after ?? null);

  return (
    <PageShell
      eyebrow="Seller detail"
      title={merchant.name}
      description={
        <>
          Current products and offer details for {merchant.domain}.{" "}
          {websiteHref ? (
            <a href={websiteHref} target="_blank" rel="noopener noreferrer">
              Visit merchant website
            </a>
          ) : null}
        </>
      }
    >
      <SummaryStrip label="Merchant coverage" items={viewData.summaryItems} />
      <p {...props(styles.secondary)}>
        {viewData.observation.lastObservedAt ? (
          <>
            {viewData.observation.leadCopy}{" "}
            <time dateTime={viewData.observation.lastObservedAt}>
              {formatProductDateLabel(viewData.observation.lastObservedAt)}
            </time>
            .
          </>
        ) : (
          viewData.observation.leadCopy
        )}{" "}
        {viewData.observation.freshnessCopy}
      </p>
      {viewData.offerRows.length ? (
        <ul aria-label="Merchant product offers" {...props(styles.list)}>
          {viewData.offerRows.map((offer) => (
            <li key={offer.id} {...props(styles.offer)}>
              {offer.product ? (
                <strong>
                  <Link to={offer.product.path}>{offer.product.name}</Link>
                </strong>
              ) : (
                <strong>Unavailable product</strong>
              )}
              <p>{offer.priceCopy}</p>
            </li>
          ))}
        </ul>
      ) : (
        <FeedbackState kind="empty" title="No active merchant offers yet." />
      )}
      {viewData.nextPagePath ? <Link to={viewData.nextPagePath}>Next offers</Link> : null}
      <Link to="/merchants">Back to all merchants</Link>
    </PageShell>
  );
}

export async function merchantDetailLoader({ context, params, request }: Route.LoaderArgs) {
  const slug = params.slug?.trim() ?? "";
  if (!slug) return merchantNotFound();
  const after = new URL(request.url).searchParams.get("after");
  const environment = getRelayEnvironmentFromRouterContext(context);

  try {
    const fetched = await fetchRouteQuery<MerchantDetailRouteQueryType>(
      environment,
      merchantDetailRouteQuery,
      { slug, first: 20, after },
      { signal: request.signal },
    );
    if (!fetched.data.merchant) {
      fetched.dispose();
      return merchantNotFound();
    }
    return {
      status: "ready" as const,
      metadata: routeMetadataFromSeo(fetched.data.merchant.seo, request.url, {
        allowIndexing: new URL(request.url).search === "",
      }),
      query: fetched.descriptor,
    };
  } catch (error) {
    throw normalizeRouteLoaderThrownError(error, "Merchant detail fetch failed");
  }
}

function merchantNotFound() {
  return data<MerchantDetailLoaderData>({ status: "not_found" }, { status: 404 });
}
