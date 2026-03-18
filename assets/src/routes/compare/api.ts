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

  try {
    const productResults = await Promise.all(
      slugs.map((slug) => loadProductDetail(slug, ssrContext))
    );

    if (productResults.some((product) => product === null)) {
      return {
        status: "not_found",
        slugs
      };
    }

    return {
      status: "ready",
      slugs,
      products: productResults.filter((product): product is ProductDetail => product !== null)
    };
  } catch {
    return {
      status: "error",
      slugs
    };
  }
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
