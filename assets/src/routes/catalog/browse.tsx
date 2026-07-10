import { Suspense } from "react";
import { Link, useLoaderData, useLocation } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import browseProductsRouteQuery, {
  type BrowseProductsRouteQuery
} from "../../__generated__/BrowseProductsRouteQuery.graphql";
import productFilterMetadataQuery, {
  type ProductFilterMetadataQuery
} from "../../__generated__/ProductFilterMetadataQuery.graphql";
import { useRoutePreloadedQuery } from "../../relay/route-preload";
import { ResettableErrorBoundary } from "../../relay/resettable-error-boundary";
import { MAX_COMPARE_PRODUCTS } from "../compare/loader";
import {
  buildComparePathFromSlugs,
  buildCurrentRoutePathWithCompareSlugs,
  selectedCompareSlugsAfterAdding,
  selectedCompareSlugsFromSearch
} from "../compare/paths";
import { CompareSelectionTray } from "../compare/selection-tray";
import {
  hasActiveCatalogFilters,
  type CatalogFilters
} from "./filters";
import { CatalogActiveFilterSummary, CatalogFilterForm } from "./filter-form";
import { browseLoader, type BrowseProductsLoaderData } from "./loader";
import {
  catalogBrowseFirstPagePath,
  catalogBrowseNextPagePath,
  catalogBrowseSearchWithNormalizedSort
} from "./paths";
import { catalogResultStatus } from "./result-status";

type BrowseProductNode = BrowseProductsRouteQuery["response"]["products"]["edges"][number]["node"];

const SPECIFICATION_HIGHLIGHT_LIMIT = 3;

const EMPTY_CATALOG_FILTERS: CatalogFilters = {
  useCaseTaxonIds: [],
  numeric: [],
  booleans: [],
  enums: []
};

export function BrowseRoute() {
  const loaderData = useLoaderData<typeof browseLoader>();

  return (
    <section>
      <h1>Browse products</h1>
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
              metadataQuery={loaderData.metadataQuery}
              pageSize={loaderData.pageSize}
              query={loaderData.query}
            />
          </Suspense>
        </ResettableErrorBoundary>
      )}
    </section>
  );
}

function BrowseProductsErrorFallback() {
  return (
    <div role="alert">
      <p>Catalog unavailable.</p>
      <p>Please refresh the page or try again later.</p>
    </div>
  );
}

function BrowseProducts({
  filters,
  metadataQuery,
  pageSize,
  query
}: {
  filters: Extract<BrowseProductsLoaderData, { status: "ready" }>["filters"];
  metadataQuery: Extract<BrowseProductsLoaderData, { status: "ready" }>["metadataQuery"];
  pageSize: Extract<BrowseProductsLoaderData, { status: "ready" }>["pageSize"];
  query: Extract<BrowseProductsLoaderData, { status: "ready" }>["query"];
}) {
  const queryRef = useRoutePreloadedQuery<BrowseProductsRouteQuery>(
    browseProductsRouteQuery,
    query
  );
  const metadataQueryRef = useRoutePreloadedQuery<ProductFilterMetadataQuery>(
    productFilterMetadataQuery,
    metadataQuery
  );
  const data = usePreloadedQuery<BrowseProductsRouteQuery>(browseProductsRouteQuery, queryRef);
  const metadataData = usePreloadedQuery<ProductFilterMetadataQuery>(
    productFilterMetadataQuery,
    metadataQueryRef
  );
  const filterMetadata = metadataData.productFilterMetadata;
  const activeFilters = filters ?? EMPTY_CATALOG_FILTERS;
  const products = data.products.edges.map(({ node }) => node);
  const location = useLocation();
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
    data.products.pageInfo.hasNextPage && data.products.pageInfo.endCursor
      ? catalogBrowseNextPagePath(
          activeFilters,
          currentPageSize,
          data.products.pageInfo.endCursor,
          selectedCompareSlugs
        )
      : null;
  const paginationLinks =
    currentAfter || nextProductsPath ? (
      <nav aria-label="Browse product pages">
        {currentAfter ? (
          <Link
            to={catalogBrowseFirstPagePath(
              activeFilters,
              currentPageSize,
              selectedCompareSlugs
            )}
          >
            First products
          </Link>
        ) : null}
        {nextProductsPath ? <Link to={nextProductsPath}>Next products</Link> : null}
      </nav>
    ) : null;
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
  const filterControls = (
    <>
      <p>{resultStatus.guidance}</p>
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
    </>
  );

  if (products.length === 0) {
    return (
      <section>
        {selectionTray}
        {filterControls}
        {resultStatus.emptyMessage ? <p>{resultStatus.emptyMessage}</p> : null}
        {paginationLinks}
      </section>
    );
  }

  return (
    <>
      {selectionTray}
      {filterControls}
      <ul>
        {products.map((product) => (
          <li key={product.id}>
            <BrowseProductCard
              currentPathname={currentBrowsePathname}
              currentSearch={currentCompareSearch}
              product={product}
              selectedCompareSlugs={selectedCompareSlugs}
            />
          </li>
        ))}
      </ul>
      {paginationLinks}
    </>
  );
}

function BrowseProductCard({
  currentPathname,
  currentSearch,
  product,
  selectedCompareSlugs
}: {
  currentPathname: string;
  currentSearch: string;
  product: BrowseProductNode;
  selectedCompareSlugs: readonly string[];
}) {
  return (
    <article aria-label={product.name}>
      <h2>{product.name}</h2>
      <p>{product.slug}</p>
      <p>{product.brand.name}</p>
      <SpecificationHighlights attributes={product.currentAttributes} />
      <ul aria-label={`Decision actions for ${product.name}`}>
        <li>
          <Link to={browseProductDetailPath(product.slug, selectedCompareSlugs)}>
            View details for {product.name}
          </Link>
        </li>
        <CompareAction
          currentPathname={currentPathname}
          currentSearch={currentSearch}
          product={product}
          selectedCompareSlugs={selectedCompareSlugs}
        />
        <li>
          <Link to={`/offers?productId=${encodeURIComponent(product.id)}`}>
            View offers for {product.name}
          </Link>
        </li>
      </ul>
    </article>
  );
}

function SpecificationHighlights({
  attributes
}: {
  attributes: BrowseProductNode["currentAttributes"];
}) {
  const highlights = [...attributes]
    .sort(
      (left, right) =>
        (left.sortOrder ?? Number.MAX_SAFE_INTEGER) -
        (right.sortOrder ?? Number.MAX_SAFE_INTEGER)
    )
    .slice(0, SPECIFICATION_HIGHLIGHT_LIMIT);

  if (highlights.length === 0) {
    return null;
  }

  return (
    <section>
      <h3>Specification highlights</h3>
      <ul aria-label="Specification highlights">
        {highlights.map((attribute) => (
          <li key={attribute.code}>
            {attribute.displayName}: {attribute.valueText}
          </li>
        ))}
      </ul>
    </section>
  );
}

function CompareAction({
  currentPathname,
  currentSearch,
  product,
  selectedCompareSlugs
}: {
  currentPathname: string;
  currentSearch: string;
  product: BrowseProductNode;
  selectedCompareSlugs: readonly string[];
}) {
  if (selectedCompareSlugs.includes(product.slug)) {
    return <li>{product.name} selected for comparison</li>;
  }

  if (selectedCompareSlugs.length >= MAX_COMPARE_PRODUCTS) {
    return <li>Compare selection full</li>;
  }

  const nextCompareSlugs = selectedCompareSlugsAfterAdding(
    selectedCompareSlugs,
    product.slug,
    MAX_COMPARE_PRODUCTS
  );

  return (
    <li>
      <Link
        to={buildCurrentRoutePathWithCompareSlugs(
          currentPathname,
          currentSearch,
          nextCompareSlugs
        )}
      >
        Add {product.name} to compare
      </Link>
    </li>
  );
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
