import { Suspense } from "react";
import { Link, useLoaderData } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import browseProductsRouteQuery, {
  type BrowseProductsRouteQuery
} from "../../__generated__/BrowseProductsRouteQuery.graphql";
import { useRoutePreloadedQuery } from "../../relay/route-preload";
import { ResettableErrorBoundary } from "../../relay/resettable-error-boundary";
import { browseLoader, type BrowseProductsLoaderData } from "./loader";

const BROWSE_PRODUCTS_PAGE_SIZES = [12, 24, 48] as const;

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
            <BrowseProducts query={loaderData.query} />
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
  query
}: {
  query: Extract<BrowseProductsLoaderData, { status: "ready" }>["query"];
}) {
  const queryRef = useRoutePreloadedQuery<BrowseProductsRouteQuery>(
    browseProductsRouteQuery,
    query
  );
  const data = usePreloadedQuery<BrowseProductsRouteQuery>(browseProductsRouteQuery, queryRef);
  const products = data.products.edges.map(({ node }) => node);
  const currentAfter = query.__relayQuery.variables.after;
  const currentPageSize = query.__relayQuery.variables.first;
  const nextProductsPath =
    data.products.pageInfo.hasNextPage && data.products.pageInfo.endCursor
      ? browseProductsNextPagePath(currentPageSize, data.products.pageInfo.endCursor)
      : null;
  const paginationLinks =
    currentAfter || nextProductsPath ? (
      <nav aria-label="Browse product pages">
        {currentAfter ? <Link to={browseProductsFirstPagePath(currentPageSize)}>First products</Link> : null}
        {nextProductsPath ? <Link to={nextProductsPath}>Next products</Link> : null}
      </nav>
    ) : null;

  if (products.length === 0) {
    return (
      <section>
        <BrowseProductsPageSizeForm pageSize={currentPageSize} />
        <p>No products available yet.</p>
        {paginationLinks}
      </section>
    );
  }

  return (
    <>
      <BrowseProductsPageSizeForm pageSize={currentPageSize} />
      <ul>
        {products.map((product) => (
          <li key={product.id}>
            <h2>
              <Link to={`/products/${product.slug}`}>{product.name}</Link>
            </h2>
            <p>{product.slug}</p>
            <p>{product.brand.name}</p>
            <p>
              <Link to={`/compare?slug=${encodeURIComponent(product.slug)}`}>
                Compare {product.name}
              </Link>
            </p>
            <p>
              <Link to={`/offers?productId=${encodeURIComponent(product.id)}`}>
                Offers for {product.name}
              </Link>
            </p>
          </li>
        ))}
      </ul>
      {paginationLinks}
    </>
  );
}

function BrowseProductsPageSizeForm({ pageSize }: { pageSize: number }) {
  return (
    <form method="get" action="/products">
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
      <button type="submit">Apply</button>
    </form>
  );
}

function browseProductsNextPagePath(first: number, endCursor: string) {
  const params = new URLSearchParams();

  params.set("first", String(first));
  params.set("after", endCursor);

  return `/products?${params.toString()}`;
}

function browseProductsFirstPagePath(first: number) {
  const params = new URLSearchParams();

  params.set("first", String(first));

  return `/products?${params.toString()}`;
}
