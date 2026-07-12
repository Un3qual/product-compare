import { Suspense } from "react";
import { useLoaderData, useLocation } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import browseProductsRouteQuery, {
  type BrowseProductsRouteQuery
} from "../../__generated__/BrowseProductsRouteQuery.graphql";
import { useRoutePreloadedQuery } from "../../relay/route-preload";
import { ResettableErrorBoundary } from "../../relay/ResettableErrorBoundary";
import { MAX_COMPARE_PRODUCTS } from "../compare/loader";
import { FeedbackState } from "../../ui/components/feedback/FeedbackState";
import { ContextRail } from "../../ui/components/layout/ContextRail";
import { PageShell } from "../../ui/components/layout/PageShell";
import { WorkspaceLayout } from "../../ui/components/layout/WorkspaceLayout";
import { Pagination } from "../../ui/components/navigation/Pagination";
import {
  buildComparePathFromSlugs,
  buildCurrentRoutePathWithCompareSlugs,
  selectedCompareSlugsAfterAdding,
  selectedCompareSlugsFromSearch
} from "../compare/paths";
import { CompareSelectionTray } from "../compare/CompareSelectionTray";
import {
  hasActiveCatalogFilters,
  type CatalogFilters
} from "./filters";
import { CatalogActiveFilterSummary, CatalogFilterForm } from "./CatalogFilterForm";
import { BrowseProductList, type BrowseCompareAction } from "./BrowseProductList";
import { browseLoader, type BrowseProductsLoaderData } from "./loader";
import {
  catalogBrowseFirstPagePath,
  catalogBrowseNextPagePath,
  catalogBrowseSearchWithNormalizedSort
} from "./paths";
import { catalogResultStatus } from "./result-status";

const EMPTY_CATALOG_FILTERS: CatalogFilters = {
  useCaseTaxonIds: [],
  numeric: [],
  booleans: [],
  enums: []
};

export function BrowseRoute() {
  const loaderData = useLoaderData<typeof browseLoader>();

  return (
    <PageShell
      description="Filter the catalog, scan the useful differences, and keep products in reach for comparison."
      eyebrow="Product catalog"
      title="Browse products"
    >
      {loaderData.status === "error" ? (
        <BrowseProductsErrorFallback />
      ) : (
        <ResettableErrorBoundary
          fallback={<BrowseProductsErrorFallback />}
          resetToken={loaderData.query}
        >
          <Suspense fallback={<p role="status">Loading catalog...</p>}>
            <BrowseProducts
              filters={loaderData.filters}
              pageSize={loaderData.pageSize}
              query={loaderData.query}
            />
          </Suspense>
        </ResettableErrorBoundary>
      )}
    </PageShell>
  );
}

function BrowseProductsErrorFallback() {
  return (
    <FeedbackState
      description="Please refresh the page or try again later."
      kind="error"
      title="Catalog unavailable."
    />
  );
}

function BrowseProducts({
  filters,
  pageSize,
  query
}: {
  filters: Extract<BrowseProductsLoaderData, { status: "ready" }>["filters"];
  pageSize: Extract<BrowseProductsLoaderData, { status: "ready" }>["pageSize"];
  query: Extract<BrowseProductsLoaderData, { status: "ready" }>["query"];
}) {
  const queryRef = useRoutePreloadedQuery<BrowseProductsRouteQuery>(
    browseProductsRouteQuery,
    query
  );
  const data = usePreloadedQuery<BrowseProductsRouteQuery>(browseProductsRouteQuery, queryRef);
  const productConnection = data.products;
  const location = useLocation();

  if (!productConnection) {
    return <BrowseProductsErrorFallback />;
  }

  const filterMetadata = data.productFilterMetadata;
  const activeFilters = filters ?? EMPTY_CATALOG_FILTERS;
  const products = productConnection.edges.map(({ node }) => node);
  const selectedCompareSlugs = selectedCompareSlugsFromSearch(location.search, {
    maxProducts: MAX_COMPARE_PRODUCTS
  });
  const currentBrowsePathname = browseRoutePathname(location.pathname);
  const currentCompareSearch = catalogBrowseSearchWithNormalizedSort(
    location.search,
    activeFilters.sort
  );
  const currentAfter = query.__relayQuery.variables.after;
  const currentPageSize = pageSize ?? query.__relayQuery.variables.first;
  const hasActiveFilters = hasActiveCatalogFilters(activeFilters);
  const resultStatus = catalogResultStatus({
    hasActiveFilters,
    hasVisibleProducts: products.length > 0,
    resultCount: filterMetadata.resultCount
  });
  const filterFormKey = catalogBrowseFirstPagePath(activeFilters, currentPageSize);
  const nextProductsPath =
    productConnection.pageInfo.hasNextPage && productConnection.pageInfo.endCursor
      ? catalogBrowseNextPagePath(
          activeFilters,
          currentPageSize,
          productConnection.pageInfo.endCursor,
          selectedCompareSlugs
        )
      : null;
  const paginationLinks = (
    <Pagination
      firstHref={
        currentAfter
          ? catalogBrowseFirstPagePath(activeFilters, currentPageSize, selectedCompareSlugs)
          : null
      }
      firstLabel="First products"
      label="Browse product pages"
      nextHref={nextProductsPath}
      nextLabel="Next products"
    />
  );
  const selectionTray =
    selectedCompareSlugs.length > 0 ? (
      <CompareSelectionTray
        items={products.map((product) => ({
          label: product.name,
          slug: product.slug
        }))}
        maxProducts={MAX_COMPARE_PRODUCTS}
        openComparePath={buildComparePathFromSlugs(selectedCompareSlugs)}
        removePathForIndex={(index) =>
          buildCurrentRoutePathWithCompareSlugs(
            currentBrowsePathname,
            currentCompareSearch,
            selectedCompareSlugs.filter((_, selectedIndex) => selectedIndex !== index)
          )
        }
        selectedSlugs={selectedCompareSlugs}
      />
    ) : null;
  const catalogControls = (
    <ContextRail description={resultStatus.guidance} label="Catalog controls">
      <CatalogFilterForm
        compareSlugs={selectedCompareSlugs}
        key={filterFormKey}
        filters={activeFilters}
        metadata={filterMetadata}
        pageSize={currentPageSize}
      />
      <CatalogActiveFilterSummary
        compareSlugs={selectedCompareSlugs}
        filters={activeFilters}
        metadata={filterMetadata}
        pageSize={currentPageSize}
      />
    </ContextRail>
  );

  if (products.length === 0) {
    return (
      <WorkspaceLayout context={catalogControls} label="Catalog results">
        {selectionTray}
        {resultStatus.emptyMessage ? (
          <FeedbackState kind="empty" title={resultStatus.emptyMessage} />
        ) : null}
        {paginationLinks}
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout context={catalogControls} label="Catalog results">
      {selectionTray}
      <BrowseProductList
        compareActionFor={(product) =>
          browseCompareAction(
            product.slug,
            currentBrowsePathname,
            currentCompareSearch,
            selectedCompareSlugs
          )
        }
        detailHrefFor={(product) =>
          browseProductDetailPath(product.slug, selectedCompareSlugs)
        }
        offerHrefFor={(product) => `/offers?productId=${encodeURIComponent(product.id)}`}
        products={products}
      />
      {paginationLinks}
    </WorkspaceLayout>
  );
}

function browseCompareAction(
  productSlug: string,
  currentPathname: string,
  currentSearch: string,
  selectedCompareSlugs: readonly string[]
): BrowseCompareAction {
  if (selectedCompareSlugs.includes(productSlug)) {
    return { kind: "selected" };
  }

  if (selectedCompareSlugs.length >= MAX_COMPARE_PRODUCTS) {
    return { kind: "full" };
  }

  return {
    href: buildCurrentRoutePathWithCompareSlugs(
      currentPathname,
      currentSearch,
      selectedCompareSlugsAfterAdding(
        selectedCompareSlugs,
        productSlug,
        MAX_COMPARE_PRODUCTS
      )
    ),
    kind: "add"
  };
}

function browseProductDetailPath(slug: string, selectedCompareSlugs: readonly string[]) {
  return buildCurrentRoutePathWithCompareSlugs(
    `/products/${encodeURIComponent(slug)}`,
    "",
    selectedCompareSlugs
  );
}

function browseRoutePathname(pathname: string) {
  return pathname === "/" ? "/products" : pathname;
}
