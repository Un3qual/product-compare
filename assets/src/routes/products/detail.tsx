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
      <section>
        <h2>Active offers</h2>
        {loaderData.offersStatus === "error" ? (
          <p>Offers unavailable.</p>
        ) : loaderData.offersStatus === "empty" ? (
          <p>No active offers yet.</p>
        ) : (
          <ul>
            {loaderData.offers.map((offer) => (
              <li key={offer.id}>
                <a href={offer.url}>{offer.merchantName}</a>
                <p>{offer.priceText}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
