import { Suspense } from "react";
import { Link, useLoaderData } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import browseProductsRouteQuery, {
  type BrowseProductsRouteQuery
} from "../../__generated__/BrowseProductsRouteQuery.graphql";
import productFilterMetadataQuery, {
  type ProductFilterMetadataQuery
} from "../../__generated__/ProductFilterMetadataQuery.graphql";
import { useRoutePreloadedQuery } from "../../relay/route-preload";
import { ResettableErrorBoundary } from "../../relay/resettable-error-boundary";
import {
  hasActiveCatalogFilters,
  type CatalogFilters
} from "./filters";
import { CatalogActiveFilterSummary, CatalogFilterForm } from "./filter-form";
import { browseLoader, type BrowseProductsLoaderData } from "./loader";
import { catalogBrowseFirstPagePath, catalogBrowseNextPagePath } from "./paths";

type BrowseProductNode = BrowseProductsRouteQuery["response"]["products"]["edges"][number]["node"];
type ProductFilterMetadata = ProductFilterMetadataQuery["response"]["productFilterMetadata"];

const EMPTY_CATALOG_FILTERS: CatalogFilters = {
  useCaseTaxonIds: [],
  numeric: [],
  booleans: [],
  enums: []
};

const EMPTY_FILTER_METADATA: ProductFilterMetadata = {
  resultCount: 0,
  typeOptions: [],
  useCaseOptions: [],
  numericFilters: [],
  booleanFilters: [],
  enumFilters: []
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
  const filterMetadata = metadataData.productFilterMetadata ?? EMPTY_FILTER_METADATA;
  const activeFilters = filters ?? EMPTY_CATALOG_FILTERS;
  const products = data.products.edges.map(({ node }) => node);
  const currentAfter = query.__relayQuery.variables.after;
  const currentPageSize = pageSize ?? query.__relayQuery.variables.first;
  const hasActiveFilters = hasActiveCatalogFilters(activeFilters);
  const hasFilteredEmptyState = hasActiveFilters && filterMetadata.resultCount === 0;
  const filterFormKey = catalogBrowseFirstPagePath(activeFilters, currentPageSize);
  const nextProductsPath =
    data.products.pageInfo.hasNextPage && data.products.pageInfo.endCursor
      ? catalogBrowseNextPagePath(activeFilters, currentPageSize, data.products.pageInfo.endCursor)
      : null;
  const paginationLinks =
    currentAfter || nextProductsPath ? (
      <nav aria-label="Browse product pages">
        {currentAfter ? (
          <Link to={catalogBrowseFirstPagePath(activeFilters, currentPageSize)}>First products</Link>
        ) : null}
        {nextProductsPath ? <Link to={nextProductsPath}>Next products</Link> : null}
      </nav>
    ) : null;
  const filterControls = (
    <>
      <CatalogFilterForm
        key={filterFormKey}
        filters={activeFilters}
        metadata={filterMetadata}
        pageSize={currentPageSize}
      />
      <CatalogActiveFilterSummary
        filters={activeFilters}
        metadata={filterMetadata}
        pageSize={currentPageSize}
      />
    </>
  );

  if (products.length === 0) {
    return (
      <section>
        {filterControls}
        <p>
          {hasFilteredEmptyState
            ? "No products match these filters."
            : "No products available yet."}
        </p>
        {paginationLinks}
      </section>
    );
  }

  return (
    <>
      {filterControls}
      <ul>
        {products.map((product) => (
          <li key={product.id}>
            <BrowseProductCard product={product} />
          </li>
        ))}
      </ul>
      {paginationLinks}
    </>
  );
}

function BrowseProductCard({ product }: { product: BrowseProductNode }) {
  return (
    <article aria-label={product.name}>
      <h2>{product.name}</h2>
      <p>{product.slug}</p>
      <p>{product.brand.name}</p>
      <ul aria-label={`Decision actions for ${product.name}`}>
        <li>
          <Link to={browseProductDetailPath(product.slug)}>
            View details for {product.name}
          </Link>
        </li>
        <li>
          <Link to={`/compare?slug=${encodeURIComponent(product.slug)}`}>
            Compare {product.name}
          </Link>
        </li>
        <li>
          <Link to={`/offers?productId=${encodeURIComponent(product.id)}`}>
            View offers for {product.name}
          </Link>
        </li>
      </ul>
    </article>
  );
}

function browseProductDetailPath(slug: string) {
  return `/products/${encodeURIComponent(slug)}`;
}
