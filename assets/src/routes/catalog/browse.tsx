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
  catalogFilterSummaryItems,
  hasActiveCatalogFilters,
  type CatalogBooleanFilter,
  type CatalogFilterMetadata,
  type CatalogFilters,
  type CatalogNumericFilter
} from "./filters";
import { browseLoader, type BrowseProductsLoaderData } from "./loader";
import { catalogBrowseFirstPagePath, catalogBrowseNextPagePath } from "./paths";

const BROWSE_PRODUCTS_PAGE_SIZES = [12, 24, 48] as const;
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
        <p>{hasActiveFilters ? "No products match these filters." : "No products available yet."}</p>
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

function CatalogFilterForm({
  filters,
  metadata,
  pageSize
}: {
  filters: CatalogFilters;
  metadata: ProductFilterMetadata;
  pageSize: number;
}) {
  return (
    <form method="get" action="/products" aria-label="Filter products">
      <label>
        Products per page
        <select key={pageSize} name="first" defaultValue={String(pageSize)}>
          {BROWSE_PRODUCTS_PAGE_SIZES.map((size) => (
            <option key={size} value={String(size)}>
              {size}
            </option>
          ))}
        </select>
      </label>
      <label>
        Product type
        <select name="typeTaxonId" defaultValue={filters.typeTaxonId ?? ""}>
          <option value="">All product types</option>
          {metadata.typeOptions.map((option) => (
            <option key={option.id} value={option.id} disabled={option.disabled && !option.selected}>
              {option.label} ({option.count})
            </option>
          ))}
        </select>
      </label>
      <label>
        <input
          type="checkbox"
          name="includeTypeDescendants"
          value="1"
          defaultChecked={filters.includeTypeDescendants === true}
        />
        Include subcategories
      </label>
      {metadata.useCaseOptions.length > 0 ? (
        <fieldset>
          <legend>Use cases</legend>
          {metadata.useCaseOptions.map((option) => (
            <label key={option.id}>
              <input
                type="checkbox"
                name="useCaseTaxonId"
                value={option.id}
                defaultChecked={filters.useCaseTaxonIds.includes(option.id) || option.selected}
                disabled={option.disabled && !option.selected}
              />
              {option.label} ({option.count})
            </label>
          ))}
        </fieldset>
      ) : null}
      {metadata.numericFilters.length > 0 ? (
        <fieldset>
          <legend>Numeric filters</legend>
          {metadata.numericFilters.map((filter) => {
            const selectedFilter = selectedNumericFilter(filters.numeric, filter.attributeId);

            return (
              <div key={filter.attributeId}>
                <label>
                  {filter.displayName} minimum
                  <input
                    inputMode="decimal"
                    name={`numeric.${filter.attributeId}.min`}
                    defaultValue={selectedFilter?.min ?? filter.selectedMin ?? ""}
                  />
                </label>
                <label>
                  {filter.displayName} maximum
                  <input
                    inputMode="decimal"
                    name={`numeric.${filter.attributeId}.max`}
                    defaultValue={selectedFilter?.max ?? filter.selectedMax ?? ""}
                  />
                </label>
              </div>
            );
          })}
        </fieldset>
      ) : null}
      {metadata.booleanFilters.length > 0 ? (
        <fieldset>
          <legend>Boolean filters</legend>
          {metadata.booleanFilters.map((filter) => {
            const selectedFilter = selectedBooleanFilter(filters.booleans, filter.attributeId);
            const selectedValue = selectedFilter?.value ?? filter.selectedValue;

            return (
              <label key={filter.attributeId}>
                {filter.displayName}
                <select
                  name={`boolean.${filter.attributeId}`}
                  defaultValue={typeof selectedValue === "boolean" ? String(selectedValue) : ""}
                >
                  <option value="">Any</option>
                  <option value="true">Yes ({filter.trueCount})</option>
                  <option value="false">No ({filter.falseCount})</option>
                </select>
              </label>
            );
          })}
        </fieldset>
      ) : null}
      {metadata.enumFilters.length > 0 ? (
        <fieldset>
          <legend>Enum filters</legend>
          {metadata.enumFilters.map((filter) => (
            <fieldset key={filter.attributeId}>
              <legend>{filter.displayName}</legend>
              {filter.options.map((option) => (
                <label key={option.id}>
                  <input
                    type="checkbox"
                    name={`enum.${filter.attributeId}`}
                    value={option.id}
                    defaultChecked={
                      filters.enums.some(
                        (selectedFilter) =>
                          selectedFilter.attributeId === filter.attributeId &&
                          selectedFilter.enumOptionId === option.id
                      ) || option.selected
                    }
                    disabled={option.disabled && !option.selected}
                  />
                  {option.label} ({option.count})
                </label>
              ))}
            </fieldset>
          ))}
        </fieldset>
      ) : null}
      <button type="submit">Apply filters</button>
    </form>
  );
}

function CatalogActiveFilterSummary({
  filters,
  metadata,
  pageSize
}: {
  filters: CatalogFilters;
  metadata: CatalogFilterMetadata;
  pageSize: number;
}) {
  if (!hasActiveCatalogFilters(filters)) {
    return null;
  }

  const summaryItems = catalogFilterSummaryItems(metadata, filters);

  return (
    <section aria-label="Applied product filters">
      {summaryItems.length > 0 ? (
        <ul aria-label="Active filters">
          {summaryItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      <Link to={catalogBrowseFirstPagePath(EMPTY_CATALOG_FILTERS, pageSize)}>Clear filters</Link>
    </section>
  );
}

function selectedNumericFilter(filters: readonly CatalogNumericFilter[], attributeId: string) {
  return filters.find((filter) => filter.attributeId === attributeId);
}

function selectedBooleanFilter(filters: readonly CatalogBooleanFilter[], attributeId: string) {
  return filters.find((filter) => filter.attributeId === attributeId);
}

function browseProductDetailPath(slug: string) {
  return `/products/${encodeURIComponent(slug)}`;
}
