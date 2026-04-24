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
        <BrowseProducts query={loaderData.query} />
      )}
    </section>
  );
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
          <p>{product.brand?.name ?? "Unknown brand"}</p>
        </li>
      ))}
    </ul>
  );
}
