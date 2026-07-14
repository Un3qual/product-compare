import { Suspense, useId } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link, useLoaderData, useLocation, useNavigate } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import productDetailRouteQuery, {
  type ProductDetailRouteQuery
} from "../../__generated__/ProductDetailRouteQuery.graphql";
import { useRoutePreloadedQuery } from "../../relay/route-preload";
import { ResettableErrorBoundary } from "../../relay/ResettableErrorBoundary";
import { SummaryStrip } from "../../ui/components/data/SummaryStrip";
import { FeedbackState } from "../../ui/components/feedback/FeedbackState";
import { ContextRail } from "../../ui/components/layout/ContextRail";
import { DetailTabs } from "../../ui/components/layout/DetailTabs";
import { PageShell } from "../../ui/components/layout/PageShell";
import { WorkspaceLayout } from "../../ui/components/layout/WorkspaceLayout";
import { tokens } from "../../ui/theme/tokens.stylex";
import { MAX_COMPARE_PRODUCTS } from "../compare/loader";
import {
  buildComparePathFromSlugs,
  buildCurrentRoutePathWithCompareSlugs,
  selectedCompareSlugsAfterAdding,
  selectedCompareSlugsFromSearch
} from "../compare/paths";
import { CompareSelectionTray } from "../compare/CompareSelectionTray";
import { productDetailLoader, type ProductDetailLoaderData } from "./loader";
import {
  ProductAttributeList,
  type ProductAttributeListItem
} from "./ProductAttributeList";
import { ProductOfferPanel } from "./ProductOfferPanel";
import { PriceWatchControl } from "./PriceWatchControl";
import { ProductCommunityPanel } from "./ProductCommunityPanel";

const styles = create({
  description: {
    display: "grid",
    gap: "0.35rem"
  },
  descriptionText: {
    margin: 0
  },
  section: {
    display: "grid",
    gap: "1rem"
  },
  sectionTitle: {
    fontSize: "1.4rem",
    letterSpacing: "-0.025em",
    margin: 0
  },
  actions: {
    display: "grid",
    gap: "0.65rem"
  },
  actionList: {
    display: "grid",
    gap: "0.65rem",
    listStyle: "none",
    margin: 0,
    padding: 0
  },
  overview: {
    display: "grid",
    gap: "1.25rem"
  },
  overviewCopy: {
    color: tokens.textSecondary,
    lineHeight: 1.65,
    margin: 0,
    maxWidth: "42rem"
  }
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
  productQuery
}: {
  productQuery: Extract<ProductDetailLoaderData, { status: "ready" }>["productQuery"];
}) {
  const queryRef = useRoutePreloadedQuery<ProductDetailRouteQuery>(
    productDetailRouteQuery,
    productQuery
  );
  const data = usePreloadedQuery<ProductDetailRouteQuery>(productDetailRouteQuery, queryRef);
  const location = useLocation();
  const navigate = useNavigate();
  const offersTitleId = useId();
  const selectedCompareSlugs = selectedCompareSlugsFromSearch(location.search, {
    maxProducts: MAX_COMPARE_PRODUCTS
  });

  if (!data.product) {
    return <ProductNotFoundFallback />;
  }

  const { product } = data;
  const selectionTray =
    selectedCompareSlugs.length > 0 ? (
      <CompareSelectionTray
        items={[
          {
            label: product.name,
            slug: product.slug
          }
        ]}
        maxProducts={MAX_COMPARE_PRODUCTS}
        openComparePath={buildComparePathFromSlugs(selectedCompareSlugs)}
        removePathForIndex={(index) =>
          productDetailPathWithCompareSlugs(
            product.slug,
            location.search,
            selectedCompareSlugs.filter((_, selectedIndex) => selectedIndex !== index),
            location.hash
          )
        }
        selectedSlugs={selectedCompareSlugs}
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
        offersAfter={new URLSearchParams(location.search).get("offersAfter")}
        selectedCompareSlugs={selectedCompareSlugs}
      />
    </section>
  );
  const detailView = detailViewFromLocation(location.hash, location.search);

  return (
    <PageShell
      description={
        <div {...props(styles.description)}>
          <p {...props(styles.descriptionText)}>
            {product.brand?.name ?? "Unknown brand"}
          </p>
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
              currentHash={location.hash}
              currentSearch={location.search}
              productId={product.id}
              productSlug={product.slug}
              selectedCompareSlugs={selectedCompareSlugs}
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
                  attributeCount={product.currentAttributes.length}
                  loadedOfferCount={product.merchantProducts?.edges.length ?? 0}
                  hasMoreOffers={product.merchantProducts?.pageInfo.hasNextPage ?? false}
                />
              ),
              label: "Overview",
              value: "overview"
            },
            {
              content: <ProductSpecifications attributes={product.currentAttributes} />,
              label: "Specifications",
              value: "specifications"
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
              value: "community"
            }
          ]}
          label="Product details"
          onValueChange={(value) =>
            void navigate(
              {
                hash: `#${value}`,
                pathname: location.pathname,
                search: location.search
              },
              { replace: true }
            )
          }
          value={detailView}
        />
      </WorkspaceLayout>
    </PageShell>
  );
}

function ProductOverview({
  attributeCount,
  hasMoreOffers,
  loadedOfferCount
}: {
  attributeCount: number;
  hasMoreOffers: boolean;
  loadedOfferCount: number;
}) {
  return (
    <section aria-label="Product overview" {...props(styles.overview)}>
      <SummaryStrip
        items={[
          { label: "Specifications available", value: attributeCount },
          {
            label: "Active offers loaded",
            value: hasMoreOffers ? `${loadedOfferCount}+` : loadedOfferCount
          }
        ]}
        label="At a glance"
      />
      <p {...props(styles.overviewCopy)}>
        Start with the available decision signals, then move into specifications or
        merchant offers when you need the supporting detail.
      </p>
    </section>
  );
}

function ProductDecisionActions({
  currentHash,
  currentSearch,
  productId,
  productSlug,
  selectedCompareSlugs
}: {
  currentHash: string;
  currentSearch: string;
  productId: string;
  productSlug: string;
  selectedCompareSlugs: readonly string[];
}) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} {...props(styles.actions)}>
      <h2 id={titleId}>Next steps</h2>
      <ul {...props(styles.actionList)}>
        <DetailCompareAction
          currentHash={currentHash}
          currentSearch={currentSearch}
          productSlug={productSlug}
          selectedCompareSlugs={selectedCompareSlugs}
        />
        <li>
          <Link to={`/offers?productId=${encodeURIComponent(productId)}`}>Review active offers</Link>
        </li>
        <li>
          <Link to={buildCurrentRoutePathWithCompareSlugs("/products", "", selectedCompareSlugs)}>
            Browse products
          </Link>
        </li>
      </ul>
    </section>
  );
}

function DetailCompareAction({
  currentHash,
  currentSearch,
  productSlug,
  selectedCompareSlugs
}: {
  currentHash: string;
  currentSearch: string;
  productSlug: string;
  selectedCompareSlugs: readonly string[];
}) {
  if (selectedCompareSlugs.includes(productSlug)) {
    return <li>This product is selected for comparison</li>;
  }

  if (selectedCompareSlugs.length >= MAX_COMPARE_PRODUCTS) {
    return <li>Compare selection full</li>;
  }

  const nextCompareSlugs = selectedCompareSlugsAfterAdding(
    selectedCompareSlugs,
    productSlug,
    MAX_COMPARE_PRODUCTS
  );

  return (
    <li>
      <Link
        to={productDetailPathWithCompareSlugs(
          productSlug,
          currentSearch,
          nextCompareSlugs,
          currentHash
        )}
      >
        Add this product to compare
      </Link>
    </li>
  );
}

function ProductSpecifications({
  attributes
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

function productDetailPath(productSlug: string) {
  return `/products/${encodeURIComponent(productSlug)}`;
}

function detailViewFromLocation(hash: string, search: string) {
  const view = hash.replace(/^#/, "");

  if (
    view === "overview" ||
    view === "specifications" ||
    view === "offers" ||
    view === "community"
  ) {
    return view;
  }

  return new URLSearchParams(search).has("offersAfter") ? "offers" : "overview";
}

function productDetailPathWithCompareSlugs(
  productSlug: string,
  search: string,
  selectedCompareSlugs: readonly string[],
  hash = ""
) {
  const path = buildCurrentRoutePathWithCompareSlugs(
    productDetailPath(productSlug),
    search,
    selectedCompareSlugs
  );

  return `${path}${hash}`;
}
