import type { LoaderFunctionArgs } from "react-router-dom";
import type { ProductDetail } from "../products/api";
import { loadProductDetail } from "../products/api";

export type CompareRouteLoaderData =
  | {
      status: "empty";
      slugs: [];
    }
  | {
      status: "too_many" | "not_found" | "error";
      slugs: string[];
    }
  | {
      status: "ready";
      slugs: string[];
      products: ProductDetail[];
    };

export async function compareLoader({
  request
}: LoaderFunctionArgs): Promise<CompareRouteLoaderData> {
  const slugs = parseSelectedSlugs(request.url);

  if (slugs.length === 0) {
    return {
      status: "empty",
      slugs: []
    };
  }

  if (slugs.length > 3) {
    return {
      status: "too_many",
      slugs
    };
  }

  const ssrContext = typeof window === "undefined" ? { request } : undefined;
  const productResults = await Promise.allSettled(
    slugs.map((slug) => loadProductDetail(slug, ssrContext))
  );

  if (productResults.some((result) => result.status === "rejected")) {
    return {
      status: "error",
      slugs
    };
  }

  const fulfilledResults = productResults.filter(
    (result): result is PromiseFulfilledResult<ProductDetail | null> =>
      result.status === "fulfilled"
  );

  if (fulfilledResults.some((result) => result.value === null)) {
    return {
      status: "not_found",
      slugs
    };
  }

  return {
    status: "ready",
    slugs,
    products: fulfilledResults.flatMap((result) =>
      result.value === null ? [] : [result.value]
    )
  };
}

function parseSelectedSlugs(requestUrl: string) {
  const url = new URL(requestUrl);
  const selected = new Set<string>();

  for (const rawSlug of url.searchParams.getAll("slug")) {
    const slug = rawSlug.trim();

    if (slug !== "") {
      selected.add(slug);
    }
  }

  return Array.from(selected);
}
