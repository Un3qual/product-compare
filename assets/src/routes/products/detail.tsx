import { useLoaderData } from "react-router-dom";
import { productDetailLoader } from "./api";

export function ProductDetailRoute() {
  const product = useLoaderData<typeof productDetailLoader>();

  return (
    <section>
      <h1>{product.name}</h1>
      <p>{product.brandName ?? "Unknown brand"}</p>
      {product.description ? <p>{product.description}</p> : null}
    </section>
  );
}
