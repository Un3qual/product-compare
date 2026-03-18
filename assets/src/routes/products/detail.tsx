import { useLoaderData } from "react-router-dom";
import type { ProductDetailLoaderData } from "./api";
import { productDetailLoader } from "./api";

export function ProductDetailRoute() {
  const loaderData = useLoaderData<typeof productDetailLoader>() as ProductDetailLoaderData;

  if (loaderData.status !== "ready") {
    return (
      <section>
        <p>{loaderData.status === "not_found" ? "Product not found." : "Product unavailable."}</p>
      </section>
    );
  }

  const { product } = loaderData;

  return (
    <section>
      <h1>{product.name}</h1>
      <p>{product.brandName ?? "Unknown brand"}</p>
      {product.description ? <p>{product.description}</p> : null}
    </section>
  );
}
