import { Suspense } from "react";
import { useLoaderData, useLocation, type LoaderFunctionArgs } from "react-router-dom";
import { graphql, usePreloadedQuery } from "react-relay";
import type { BrowseRouteQuery } from "$generated/BrowseRouteQuery.graphql";
import { ResettableErrorBoundary } from "$relay/ResettableErrorBoundary";
import {
  fetchRouteQuery,
  getRelayEnvironmentFromRouterContext,
  useRoutePreloadedQuery,
  type RelayRouteQueryDescriptor,
} from "$relay/route-preload";
import { recoverRouteLoaderError } from "$routes/loader-errors";
import { FeedbackState } from "$ui/components/feedback/FeedbackState";
import { ContextRail } from "$ui/components/layout/ContextRail";
import { PageShell } from "$ui/components/layout/PageShell";
import { WorkspaceLayout } from "$ui/components/layout/WorkspaceLayout";
import { Pagination } from "$ui/components/navigation/Pagination";
import { MAX_COMPARE_PRODUCTS, buildComparePathFromSlugs } from "../compare/paths";
import { CompareSelectionTray } from "../compare/CompareSelectionTray";
import { productOffersPath } from "../offers/paths";
import { createBrowseRouteData } from "./browse-route-data";
import {
  catalogFiltersFromUrl,
  catalogFiltersToProductFiltersInput,
  hasActiveCatalogFilters,
  type CatalogFilters,
} from "./filters";
import { CatalogActiveFilterSummary, CatalogFilterForm } from "./CatalogFilterForm";
import { BrowseProductList } from "./BrowseProductList";
import {
  buildCatalogBrowsePaginationData,
  catalogBrowseFirstPagePath,
  catalogBrowseSearchWithNormalizedSort,
} from "./paths";
import { catalogResultStatus } from "./result-status";

const browseRouteQuery = graphql`
  query BrowseRouteQuery($first: Int!, $after: String, $filters: ProductFiltersInput) {
    products(first: $first, after: $after, filters: $filters) {
      edges {
        cursor
        node {
          id
          name
          slug
        }
      }
      ...BrowseProductList_products
      pageInfo {
        hasNextPage
        endCursor
      }
    }
    productFilterMetadata(filters: $filters) {
      resultCount
      typeOptions {
        id
        label
        count
        selected
        disabled
      }
      useCaseOptions {
        id
        label
        count
        selected
        disabled
      }
      numericFilters {
        attributeId
        code
        displayName
        unitSymbol
        min
        max
        selectedMin
        selectedMax
      }
      booleanFilters {
        attributeId
        code
        displayName
        trueCount
        falseCount
        selectedValue
      }
      enumFilters {
        attributeId
        code
        displayName
        options {
          id
          label
          count
          selected
          disabled
        }
      }
    }
  }
`;

const BROWSE_PRODUCTS_DEFAULT_PAGE_SIZE = 12;
const BROWSE_PRODUCTS_PAGE_SIZES = [12, 24, 48] as const;
type BrowseProductsPageSize = (typeof BROWSE_PRODUCTS_PAGE_SIZES)[number];

export type BrowseProductsLoaderData =
  | {
      status: "ready";
      filters: CatalogFilters;
      pageSize: BrowseProductsPageSize;
      query: RelayRouteQueryDescriptor<BrowseRouteQuery["variables"]>;
    }
  | { status: "error" };

const EMPTY_CATALOG_FILTERS: CatalogFilters = {
  useCaseTaxonIds: [],
  numeric: [],
  booleans: [],
  enums: [],
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
  query,
}: {
  filters: Extract<BrowseProductsLoaderData, { status: "ready" }>["filters"];
  pageSize: Extract<BrowseProductsLoaderData, { status: "ready" }>["pageSize"];
  query: Extract<BrowseProductsLoaderData, { status: "ready" }>["query"];
}) {
  const queryRef = useRoutePreloadedQuery<BrowseRouteQuery>(browseRouteQuery, query);
  const data = usePreloadedQuery<BrowseRouteQuery>(browseRouteQuery, queryRef);
  const productConnection = data.products;
  const location = useLocation();

  if (!productConnection) {
    return <BrowseProductsErrorFallback />;
  }

  const filterMetadata = data.productFilterMetadata;
  const activeFilters = filters ?? EMPTY_CATALOG_FILTERS;
  const products = productConnection.edges.map(({ node }) => node);
  const currentCompareSearch = catalogBrowseSearchWithNormalizedSort(
    location.search,
    activeFilters,
  );
  const browseRouteData = createBrowseRouteData({
    pathname: location.pathname,
    search: currentCompareSearch,
    selectedCompareSlugs: new URLSearchParams(location.search).getAll("slug"),
  });
  const selectedCompareSlugs = browseRouteData.selectedCompareSlugs;
  const currentAfter = query.__relayQuery.variables.after;
  const currentPageSize = pageSize ?? query.__relayQuery.variables.first;
  const hasActiveFilters = hasActiveCatalogFilters(activeFilters);
  const resultStatus = catalogResultStatus({
    hasActiveFilters,
    hasVisibleProducts: products.length > 0,
    resultCount: filterMetadata.resultCount,
  });
  const filterFormKey = catalogBrowseFirstPagePath(activeFilters, currentPageSize);
  const paginationData = buildCatalogBrowsePaginationData({
    currentAfter: currentAfter ?? null,
    endCursor: productConnection.pageInfo.endCursor ?? null,
    filters: activeFilters,
    first: currentPageSize,
    hasNextPage: productConnection.pageInfo.hasNextPage,
    selectedCompareSlugs,
  });
  const paginationLinks = (
    <Pagination
      firstHref={paginationData.firstHref}
      firstLabel="First products"
      label="Browse product pages"
      nextHref={paginationData.nextHref}
      nextLabel="Next products"
    />
  );
  const selectionTray =
    selectedCompareSlugs.length > 0 ? (
      <CompareSelectionTray
        items={products.map((product) => ({
          label: product.name,
          slug: product.slug,
        }))}
        maxProducts={MAX_COMPARE_PRODUCTS}
        openComparePath={buildComparePathFromSlugs(selectedCompareSlugs)}
        removePathForIndex={browseRouteData.removeSelectedPathForIndex}
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
        compareActionFor={(product) => browseRouteData.compareActionFor(product.slug)}
        detailHrefFor={(product) => browseRouteData.productDetailPathFor(product.slug)}
        offerHrefFor={(product) => productOffersPath(product.id, selectedCompareSlugs)}
        products={productConnection}
      />
      {paginationLinks}
    </WorkspaceLayout>
  );
}

export async function browseLoader({
  context,
  request,
}: LoaderFunctionArgs): Promise<BrowseProductsLoaderData> {
  const environment = getRelayEnvironmentFromRouterContext(context);
  const requestUrl = new URL(request.url);
  const filters = catalogFiltersFromUrl(requestUrl);
  const productFiltersInput = catalogFiltersToProductFiltersInput(filters);
  const pageSize = browseProductsPageSizeFromUrl(requestUrl);
  const variables: BrowseRouteQuery["variables"] = { first: pageSize };
  const after = nonBlankParam(requestUrl, "after");

  if (after) variables.after = after;
  if (productFiltersInput) variables.filters = productFiltersInput;

  try {
    const queryResult = await fetchRouteQuery<BrowseRouteQuery>(
      environment,
      browseRouteQuery,
      variables,
      { signal: request.signal },
    );

    return {
      status: "ready",
      filters,
      pageSize,
      query: queryResult.descriptor,
    };
  } catch (error) {
    return recoverRouteLoaderError<BrowseProductsLoaderData>(
      error,
      "Failed to preload browse products route query.",
      { status: "error" },
    );
  }
}

function browseProductsPageSizeFromUrl(url: URL) {
  const value = nonBlankParam(url, "first");

  if (value === null || !/^\d+$/.test(value)) return BROWSE_PRODUCTS_DEFAULT_PAGE_SIZE;

  const parsedValue = Number.parseInt(value, 10);
  return isBrowseProductsPageSize(parsedValue) ? parsedValue : BROWSE_PRODUCTS_DEFAULT_PAGE_SIZE;
}

function isBrowseProductsPageSize(value: number): value is BrowseProductsPageSize {
  return BROWSE_PRODUCTS_PAGE_SIZES.includes(value as BrowseProductsPageSize);
}

function nonBlankParam(url: URL, name: string) {
  const rawValue = url.searchParams.get(name);
  if (rawValue === null) return null;

  const value = rawValue.trim();
  return value === "" ? null : value;
}
