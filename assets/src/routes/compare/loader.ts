import type { LoaderFunctionArgs } from "react-router-dom";
import productDetailRouteQuery, {
  type ProductDetailRouteQuery
} from "../../__generated__/ProductDetailRouteQuery.graphql";
import {
  fetchRouteQuery,
  getRelayEnvironmentFromRouterContext,
  type FetchedRelayRouteQuery,
  type RelayRouteQueryDescriptor
} from "../../relay/route-preload";

const MAX_COMPARE_PRODUCTS = 3;

export interface CompareProductSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  brandName: string | null;
}

export type CompareRouteLoaderData =
  | {
      status: "empty";
      slugs: [];
    }
  | {
      status: "too_many" | "not_found";
      slugs: string[];
    }
  | {
      status: "ready";
      slugs: string[];
      productQueries: Array<RelayRouteQueryDescriptor<ProductDetailRouteQuery["variables"]>>;
      products: CompareProductSummary[];
    };

type FetchedCompareProductQuery = FetchedRelayRouteQuery<ProductDetailRouteQuery>;

export async function compareLoader({
  context,
  request
}: LoaderFunctionArgs): Promise<CompareRouteLoaderData> {
  const slugs = parseSelectedSlugs(request.url);

  if (slugs.length === 0) {
    return {
      status: "empty",
      slugs: []
    };
  }

  if (slugs.length > MAX_COMPARE_PRODUCTS) {
    return {
      status: "too_many",
      slugs
    };
  }

  const environment = getRelayEnvironmentFromRouterContext(context);
  const productResults = await Promise.allSettled(
    slugs.map((slug) =>
      fetchRouteQuery<ProductDetailRouteQuery>(
        environment,
        productDetailRouteQuery,
        { slug },
        { signal: request.signal }
      )
    )
  );
  const fetchedProductQueries = productResults
    .filter(isFulfilled)
    .map((result) => result.value);
  const rejectedResult = productResults.find(isRejected);

  if (rejectedResult) {
    disposeFetchedProductQueries(fetchedProductQueries);
    throw normalizeProductFetchError(rejectedResult.reason);
  }

  const products = fetchedProductQueries.map(({ data }) => data.product);

  if (products.some((product) => !product)) {
    disposeFetchedProductQueries(fetchedProductQueries);

    return {
      status: "not_found",
      slugs
    };
  }

  return {
    status: "ready",
    slugs,
    productQueries: fetchedProductQueries.map((query) => query.descriptor),
    products: products.filter(isPresentProduct).map(summarizeProduct)
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

function summarizeProduct(
  product: NonNullable<ProductDetailRouteQuery["response"]["product"]>
): CompareProductSummary {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: typeof product.description === "string" ? product.description : null,
    brandName: product.brand?.name ?? null
  };
}

function disposeFetchedProductQueries(productQueries: FetchedCompareProductQuery[]) {
  for (const productQuery of productQueries) {
    productQuery.dispose();
  }
}

function normalizeProductFetchError(error: unknown) {
  if (isAbortError(error) || error instanceof Error) {
    return error;
  }

  const wrappedError = new Error("Product fetch failed") as Error & { cause?: unknown };
  wrappedError.cause = error;

  return wrappedError;
}

function isAbortError(error: unknown) {
  return getErrorName(error) === "AbortError";
}

function getErrorName(error: unknown) {
  if (!error || typeof error !== "object" || !("name" in error)) {
    return null;
  }

  return error.name;
}

function isPresentProduct(
  product: ProductDetailRouteQuery["response"]["product"]
): product is NonNullable<ProductDetailRouteQuery["response"]["product"]> {
  return Boolean(product);
}

function isFulfilled<T>(result: PromiseSettledResult<T>): result is PromiseFulfilledResult<T> {
  return result.status === "fulfilled";
}

function isRejected<T>(result: PromiseSettledResult<T>): result is PromiseRejectedResult {
  return result.status === "rejected";
}
