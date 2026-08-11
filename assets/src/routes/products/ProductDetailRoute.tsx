import { Suspense, useId } from "react";
import { create, props } from "@stylexjs/stylex";
import {
  data,
  redirect,
  useLoaderData,
  useLocation,
  useNavigate,
  type LoaderFunctionArgs,
} from "react-router-dom";
import { graphql, usePreloadedQuery } from "react-relay";
import type { ProductDetailRouteQuery } from "$generated/ProductDetailRouteQuery.graphql";
import { RouteLoaderGraphQLError } from "$relay/environment";
import { ResettableErrorBoundary } from "$relay/ResettableErrorBoundary";
import {
  cacheRouteQueryData,
  fetchRouteQuery,
  getRelayEnvironmentFromRouterContext,
  useRoutePreloadedQuery,
  type RelayRouteQueryDescriptor,
} from "$relay/route-preload";
import { recoverRouteLoaderError } from "$routes/loader-errors";
import { routeMetadataFromSeo } from "$routes/seo";
import type { RouteDocumentMetadata } from "$routes/RouteMetadata";
import { SummaryStrip } from "$ui/components/data/SummaryStrip";
import { FeedbackState } from "$ui/components/feedback/FeedbackState";
import { ContextRail } from "$ui/components/layout/ContextRail";
import { DetailTabs } from "$ui/components/layout/DetailTabs";
import { PageShell } from "$ui/components/layout/PageShell";
import { WorkspaceLayout } from "$ui/components/layout/WorkspaceLayout";
import { tokens } from "../../ui/theme/tokens.stylex";
import { MAX_COMPARE_PRODUCTS } from "../compare/paths";
import { CompareSelectionTray } from "../compare/CompareSelectionTray";
import { productOffersPath } from "../offers/paths";
import { ProductAttributeList, type ProductAttributeListItem } from "./ProductAttributeList";
import { ProductDecisionActions } from "./ProductDecisionActions";
import { ProductOfferPanel } from "./ProductOfferPanel";
import { PriceWatchControl } from "./PriceWatchControl";
import { ProductCommunityPanel } from "./ProductCommunityPanel";
import {
  createProductDetailRouteData,
  overviewSummaryItems,
  type ProductOverviewSummaryItem,
} from "./product-detail-route-data";

const productDetailRouteQuery = graphql`
  query ProductDetailRouteQuery($slug: String!, $offerFirst: Int!, $offersAfter: String) {
    product(slug: $slug) {
      id
      name
      slug
      description
      seo {
        title
        description
        canonicalPath
        indexable
        imageUrl
        structuredData
      }
      brand {
        id
        name
      }
      currentAttributes {
        attributeId
        code
        displayName
        dataType
        valueText
        sortOrder
        groupLabel
        isRequired
        numericValue
        booleanValue
        enumOptionId
        unitSymbol
      }
      merchantProducts(first: $offerFirst, after: $offersAfter, activeOnly: true) {
        edges {
          cursor
        }
        pageInfo {
          endCursor
          hasNextPage
        }
        ...ProductOfferPanel_connection
      }
    }
  }
`;

const PRODUCT_OFFERS_PAGE_SIZE = 6;

export type ProductDetailLoaderData =
  | {
      status: "ready";
      metadata: RouteDocumentMetadata;
      productQuery: RelayRouteQueryDescriptor<ProductDetailRouteQuery["variables"]>;
    }
  | { status: "not_found" | "error" };

export type ProductDetailLoaderResult =
  | ProductDetailLoaderData
  | ReturnType<typeof data<ProductDetailLoaderData>>
  | Response;

type ProductDetailResponseWithProduct = ProductDetailRouteQuery["response"] & {
  product: NonNullable<ProductDetailRouteQuery["response"]["product"]>;
};

const styles = create({
  description: {
    display: "grid",
    gap: "0.35rem",
  },
  descriptionText: {
    margin: 0,
  },
  section: {
    display: "grid",
    gap: "1rem",
  },
  sectionTitle: {
    fontSize: "1.4rem",
    letterSpacing: "-0.025em",
    margin: 0,
  },
  overview: {
    display: "grid",
    gap: "1.25rem",
  },
  overviewCopy: {
    color: tokens.textSecondary,
    lineHeight: 1.65,
    margin: 0,
    maxWidth: "42rem",
  },
});

export function ProductDetailRoute() {
  const loaderData = useLoaderData<typeof productDetailLoader>();

  if (loaderData.status !== "ready") {
    return loaderData.status === "not_found" ? (
      <ProductNotFoundFallback />
    ) : (
      <ProductUnavailableFallback />
    );
  }

  return (
    <ResettableErrorBoundary
      resetToken={loaderData.productQuery}
      fallback={<ProductUnavailableFallback />}
    >
      <Suspense fallback={<p role="status">Loading product...</p>}>
        <ProductDetail productQuery={loaderData.productQuery} />
      </Suspense>
    </ResettableErrorBoundary>
  );
}

function ProductDetail({
  productQuery,
}: {
  productQuery: Extract<ProductDetailLoaderData, { status: "ready" }>["productQuery"];
}) {
  const queryRef = useRoutePreloadedQuery<ProductDetailRouteQuery>(
    productDetailRouteQuery,
    productQuery,
  );
  const data = usePreloadedQuery<ProductDetailRouteQuery>(productDetailRouteQuery, queryRef);
  const location = useLocation();
  const navigate = useNavigate();
  const offersTitleId = useId();
  if (!data.product) {
    return <ProductNotFoundFallback />;
  }

  const { product } = data;
  const routeData = createProductDetailRouteData({
    hash: location.hash,
    productSlug: product.slug,
    search: location.search,
  });
  const selectionTray =
    routeData.selectedCompareSlugs.length > 0 ? (
      <CompareSelectionTray
        items={[
          {
            label: product.name,
            slug: product.slug,
          },
        ]}
        maxProducts={MAX_COMPARE_PRODUCTS}
        openComparePath={routeData.comparePath}
        removePathForIndex={routeData.removeSelectedPathForIndex}
        selectedSlugs={routeData.selectedCompareSlugs}
      />
    ) : null;
  const offers = (
    <section aria-labelledby={offersTitleId} {...props(styles.section)}>
      <h2 id={offersTitleId} {...props(styles.sectionTitle)}>
        Active offers
      </h2>
      <ProductOfferPanel
        connection={product.merchantProducts}
        productSlug={product.slug}
        offersAfter={routeData.offersAfter}
        selectedCompareSlugs={routeData.selectedCompareSlugs}
      />
    </section>
  );

  return (
    <PageShell
      description={
        <div {...props(styles.description)}>
          <p {...props(styles.descriptionText)}>{product.brand?.name ?? "Unknown brand"}</p>
          {product.description ? (
            <p {...props(styles.descriptionText)}>{product.description}</p>
          ) : null}
        </div>
      }
      eyebrow="Product detail"
      title={product.name}
    >
      <WorkspaceLayout
        context={
          <ContextRail
            description="Add this product to a comparison, review offers, or return to the catalog."
            label="Product decisions"
          >
            {selectionTray}
            <ProductDecisionActions
              browseHref={routeData.browsePath}
              compareAction={routeData.compareAction}
              offerHref={productOffersPath(product.id)}
            />
            <PriceWatchControl productId={product.id} />
          </ContextRail>
        }
        label="Product detail workspace"
      >
        <DetailTabs
          items={[
            {
              content: (
                <ProductOverview
                  summaryItems={overviewSummaryItems({
                    attributeCount: product.currentAttributes.length,
                    loadedOfferCount: product.merchantProducts?.edges.length ?? 0,
                    hasMoreOffers: product.merchantProducts?.pageInfo.hasNextPage ?? false,
                  })}
                />
              ),
              label: "Overview",
              value: "overview",
            },
            {
              content: <ProductSpecifications attributes={product.currentAttributes} />,
              label: "Specifications",
              value: "specifications",
            },
            { content: offers, label: "Offers", value: "offers" },
            {
              content: (
                <ResettableErrorBoundary
                  resetToken={product.slug}
                  fallback={<FeedbackState kind="error" title="Reviews and Q&A unavailable." />}
                >
                  <Suspense
                    fallback={<FeedbackState kind="loading" title="Loading reviews and Q&A..." />}
                  >
                    <ProductCommunityPanel
                      key={product.id}
                      productId={product.id}
                      productSlug={product.slug}
                    />
                  </Suspense>
                </ResettableErrorBoundary>
              ),
              label: "Reviews & Q&A",
              value: "community",
            },
          ]}
          label="Product details"
          onValueChange={(value) =>
            void navigate(
              {
                hash: `#${value}`,
                pathname: location.pathname,
                search: location.search,
              },
              { replace: true },
            )
          }
          value={routeData.detailView}
        />
      </WorkspaceLayout>
    </PageShell>
  );
}

function ProductOverview({
  summaryItems,
}: {
  summaryItems: readonly ProductOverviewSummaryItem[];
}) {
  return (
    <section aria-label="Product overview" {...props(styles.overview)}>
      <SummaryStrip items={summaryItems} label="At a glance" />
      <p {...props(styles.overviewCopy)}>
        Start with the available decision signals, then move into specifications or merchant offers
        when you need the supporting detail.
      </p>
    </section>
  );
}

function ProductSpecifications({
  attributes,
}: {
  attributes: ReadonlyArray<ProductAttributeListItem>;
}) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} {...props(styles.section)}>
      <h2 id={titleId} {...props(styles.sectionTitle)}>
        Specifications
      </h2>
      <ProductAttributeList
        attributes={attributes}
        emptyMessage="No product attributes available yet."
      />
    </section>
  );
}

function ProductUnavailableFallback() {
  return (
    <PageShell title="Product unavailable" width="reading">
      <FeedbackState kind="error" title="Product unavailable." />
    </PageShell>
  );
}

function ProductNotFoundFallback() {
  return (
    <PageShell title="Product not found" width="reading">
      <FeedbackState kind="empty" title="Product not found." />
    </PageShell>
  );
}

export async function productDetailLoader({
  context,
  params,
  request,
}: LoaderFunctionArgs): Promise<ProductDetailLoaderResult> {
  const slug = params.slug?.trim() ?? "";
  const offersAfter = new URL(request.url).searchParams.get("offersAfter");

  if (slug === "") return productNotFoundResult();

  const environment = getRelayEnvironmentFromRouterContext(context);
  const variables: ProductDetailRouteQuery["variables"] = {
    slug,
    offerFirst: PRODUCT_OFFERS_PAGE_SIZE,
    offersAfter,
  };

  try {
    const productRouteQuery = await fetchRouteQuery<ProductDetailRouteQuery>(
      environment,
      productDetailRouteQuery,
      variables,
      { signal: request.signal },
    );

    if (!productRouteQuery.data.product) {
      productRouteQuery.dispose();
      return productNotFoundResult();
    }

    if (productRouteQuery.data.product.slug !== slug) {
      productRouteQuery.dispose();
      const canonicalUrl = new URL(request.url);
      canonicalUrl.pathname = `/products/${encodeURIComponent(productRouteQuery.data.product.slug)}`;
      return redirect(`${canonicalUrl.pathname}${canonicalUrl.search}`, 301);
    }

    return {
      status: "ready",
      metadata: routeMetadataFromSeo(productRouteQuery.data.product.seo, request.url, {
        allowIndexing: new URL(request.url).search === "",
      }),
      productQuery: productRouteQuery.descriptor,
    };
  } catch (error) {
    const partialData = partialProductData(error);

    if (partialData) {
      return {
        status: "ready",
        metadata: routeMetadataFromSeo(partialData.product.seo, request.url, {
          allowIndexing: new URL(request.url).search === "",
        }),
        productQuery: cacheRouteQueryData<ProductDetailRouteQuery>(
          environment,
          productDetailRouteQuery,
          variables,
          partialData,
        ),
      };
    }

    return recoverRouteLoaderError<ProductDetailLoaderData>(
      error,
      "Failed to preload product detail route query.",
      { status: "error" },
    );
  }
}

function productNotFoundResult() {
  return data<ProductDetailLoaderData>({ status: "not_found" }, { status: 404 });
}

function partialProductData(error: unknown): ProductDetailResponseWithProduct | null {
  if (!(error instanceof RouteLoaderGraphQLError)) return null;
  const response = error.response;
  if (Array.isArray(response) || !("data" in response)) return null;

  const responseData = response.data as ProductDetailRouteQuery["response"] | null | undefined;
  return hasProduct(responseData) ? responseData : null;
}

function hasProduct(
  productData: ProductDetailRouteQuery["response"] | null | undefined,
): productData is ProductDetailResponseWithProduct {
  return productData?.product !== null && productData?.product !== undefined;
}
