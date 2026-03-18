import { useLoaderData } from "react-router-dom";
import type { CompareRouteLoaderData } from "./api";
import { compareLoader } from "./api";

export function CompareRoute() {
  const loaderData = useLoaderData<typeof compareLoader>() as CompareRouteLoaderData;

  if (loaderData.status === "ready") {
    return (
      <section>
        <h1>Compare products</h1>
        <ul>
          {loaderData.products.map((product) => (
            <li key={product.id}>
              <article>
                <h2>{product.name}</h2>
                <p>{product.brandName ?? "Unknown brand"}</p>
                <p>{product.slug}</p>
                {product.description ? <p>{product.description}</p> : null}
              </article>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section>
      <h1>Compare products</h1>
      {loaderData.status === "empty" ? <p>Choose up to 3 products to compare.</p> : null}
      {loaderData.status === "too_many" ? <p>You can compare up to 3 products.</p> : null}
    </section>
  );
}
