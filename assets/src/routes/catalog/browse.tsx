import { useLoaderData } from "react-router-dom";
import type { BrowseProductsLoaderData } from "./api";

export function BrowseRoute() {
  const { products } = useLoaderData() as BrowseProductsLoaderData;

  return (
    <section>
      <h1>Browse products</h1>
      <ul>
        {products.map((product) => (
          <li key={product.id}>
            <h2>{product.name}</h2>
            <p>{product.slug}</p>
            <p>{product.brandName ?? "Unknown brand"}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
