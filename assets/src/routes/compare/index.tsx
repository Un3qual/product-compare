import { useLoaderData } from "react-router-dom";
import type { CompareRouteLoaderData } from "./api";
import { compareLoader } from "./api";

export function CompareRoute() {
  const loaderData = useLoaderData<typeof compareLoader>() as CompareRouteLoaderData;

  return (
    <section>
      <h1>Compare products</h1>
      {loaderData.status === "empty" ? (
        <p>Choose up to 3 products to compare.</p>
      ) : loaderData.status === "too_many" ? (
        <p>You can compare up to 3 products.</p>
      ) : (
        <ul>
          {loaderData.slugs.map((slug) => (
            <li key={slug}>{slug}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
