import { Component, Suspense, type ReactNode } from "react";
import { Link, useLoaderData } from "react-router-dom";
import { usePreloadedQuery } from "react-relay";
import browseProductsRouteQuery, {
  type BrowseProductsRouteQuery
} from "../../__generated__/BrowseProductsRouteQuery.graphql";
import { useRoutePreloadedQuery } from "../../relay/route-preload";
import { browseLoader, type BrowseProductsLoaderData } from "./loader";

export function BrowseRoute() {
  const loaderData = useLoaderData<typeof browseLoader>();

  return (
    <section>
      <h1>Browse products</h1>
      {loaderData.status === "error" ? (
        <p>Catalog unavailable.</p>
      ) : (
        <BrowseProductsErrorBoundary resetToken={loaderData.query}>
          <Suspense fallback={<p role="status">Loading catalog...</p>}>
            <BrowseProducts query={loaderData.query} />
          </Suspense>
        </BrowseProductsErrorBoundary>
      )}
    </section>
  );
}

type BrowseProductsErrorBoundaryState = {
  hasError: boolean;
};

class BrowseProductsErrorBoundary extends Component<
  { children: ReactNode; resetToken: unknown },
  BrowseProductsErrorBoundaryState
> {
  state: BrowseProductsErrorBoundaryState = {
    hasError: false
  };

  static getDerivedStateFromError(): BrowseProductsErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidUpdate(previousProps: { resetToken: unknown }) {
    if (this.state.hasError && previousProps.resetToken !== this.props.resetToken) {
      this.setState({ hasError: false });
    }
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div role="alert">
          <p>Catalog unavailable.</p>
          <p>Please refresh the page or try again later.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

function BrowseProducts({ query }: { query: Extract<BrowseProductsLoaderData, { status: "ready" }>["query"] }) {
  const queryRef = useRoutePreloadedQuery<BrowseProductsRouteQuery>(browseProductsRouteQuery, query);
  const data = usePreloadedQuery<BrowseProductsRouteQuery>(browseProductsRouteQuery, queryRef);
  const products = data.products.edges.map(({ node }) => node);

  if (products.length === 0) {
    return <p>No products available yet.</p>;
  }

  return (
    <ul>
      {products.map((product) => (
        <li key={product.id}>
          <h2>
            <Link to={`/products/${product.slug}`}>{product.name}</Link>
          </h2>
          <p>{product.slug}</p>
          <p>{product.brand.name}</p>
        </li>
      ))}
    </ul>
  );
}
