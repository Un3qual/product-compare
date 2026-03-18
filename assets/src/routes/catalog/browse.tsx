import { useLoaderData } from "react-router-dom";
import type { BrowseProductsLoaderData } from "./api";

export function BrowseRoute() {
  const { products, status } = useLoaderData() as BrowseProductsLoaderData;

  return (
    <section>
      <h1>Browse products</h1>
      {status === "error" ? (
        <p>Catalog unavailable.</p>
      ) : products.length === 0 ? (
        <p>No products available yet.</p>
      ) : (
        <ul>
          {products.map((product) => (
            <li key={product.id}>
              <h2>{product.name}</h2>
              <p>{product.slug}</p>
              <p>{product.brandName ?? "Unknown brand"}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
