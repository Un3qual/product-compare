import { Suspense } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link, useLoaderData, useLocation } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import browseProductsRouteQuery, {
  type BrowseProductsRouteQuery
} from "../../__generated__/BrowseProductsRouteQuery.graphql";
import { useRoutePreloadedQuery } from "../../relay/route-preload";
import { ResettableErrorBoundary } from "../../relay/resettable-error-boundary";
import { MAX_COMPARE_PRODUCTS } from "../compare/loader";
import { DataList, DataListItem } from "../../ui/components/data/data-list";
import { FeedbackState } from "../../ui/components/feedback/feedback-state";
import { PageShell } from "../../ui/components/layout/page-shell";
import { Pagination } from "../../ui/components/navigation/pagination";
import { tokens } from "../../ui/theme/tokens.stylex";
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

const styles = create({
  product: {
    display: "grid",
    gap: "0.8rem"
  },
  productHeading: {
    fontSize: "1.35rem",
    letterSpacing: "-0.02em",
    margin: 0
  },
  metadata: {
    color: tokens.textSecondary,
    display: "flex",
    flexWrap: "wrap",
    gap: "0.45rem 1rem"
  },
  metadataItem: {
    margin: 0
  },
  actionList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.6rem 1rem",
    listStyle: "none",
    margin: 0,
    padding: 0
  },
  highlights: {
    display: "grid",
    gap: "0.45rem"
  },
  highlightsTitle: {
    color: tokens.textSecondary,
    fontSize: "0.8rem",
    letterSpacing: "0.06em",
    margin: 0,
    textTransform: "uppercase"
  },
  highlightsList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.45rem 1.25rem",
    listStyle: "none",
    margin: 0,
    padding: 0
  }
});

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
  const filterMetadata = data.productFilterMetadata;
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
        {resultStatus.emptyMessage ? (
          <FeedbackState kind="empty" title={resultStatus.emptyMessage} />
        ) : null}
        {paginationLinks}
      </section>
    );
  }

  return (
    <>
      {selectionTray}
      {filterControls}
      <DataList label="Products">
        {products.map((product) => (
          <DataListItem key={product.id}>
            <BrowseProductCard
              currentPathname={currentBrowsePathname}
              currentSearch={currentCompareSearch}
              product={product}
              selectedCompareSlugs={selectedCompareSlugs}
            />
          </DataListItem>
        ))}
      </DataList>
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
    <article aria-label={product.name} {...props(styles.product)}>
      <h2 {...props(styles.productHeading)}>{product.name}</h2>
      <div {...props(styles.metadata)}>
        <p {...props(styles.metadataItem)}>{product.brand.name}</p>
        <p {...props(styles.metadataItem)}>{product.slug}</p>
      </div>
      <SpecificationHighlights attributes={product.currentAttributes} />
      <ul
        aria-label={`Decision actions for ${product.name}`}
        {...props(styles.actionList)}
      >
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
    <section {...props(styles.highlights)}>
      <h3 {...props(styles.highlightsTitle)}>Specification highlights</h3>
      <ul aria-label="Specification highlights" {...props(styles.highlightsList)}>
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
