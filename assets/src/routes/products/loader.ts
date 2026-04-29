import type { LoaderFunctionArgs } from "react-router-dom";
import type { Environment } from "relay-runtime";
import productDetailRouteQuery, {
  type ProductDetailRouteQuery
} from "../../__generated__/ProductDetailRouteQuery.graphql";
import productOffersRouteQuery, {
  type ProductOffersRouteQuery
} from "../../__generated__/ProductOffersRouteQuery.graphql";
import {
  fetchRouteQuery,
  getRelayEnvironmentFromRouterContext,
  preloadRouteQuery,
  type RelayRouteQueryDescriptor
} from "../../relay/route-preload";

const PRODUCT_OFFERS_PAGE_SIZE = 6;

export type ProductOffersLoaderData =
  | {
      status: "ready";
      query: RelayRouteQueryDescriptor<ProductOffersRouteQuery["variables"]>;
    }
  | {
      status: "error";
    };

export type ProductDetailLoaderData =
  | {
      status: "ready";
      productQuery: RelayRouteQueryDescriptor<ProductDetailRouteQuery["variables"]>;
      offers: ProductOffersLoaderData;
    }
  | {
      status: "not_found" | "error";
    };

export async function productDetailLoader({
  context,
  params,
  request
}: LoaderFunctionArgs): Promise<ProductDetailLoaderData> {
  const slug = params.slug?.trim() ?? "";

  if (slug === "") {
    throw new Error("Product slug is required");
  }

  const environment = getRelayEnvironmentFromRouterContext(context);

  try {
    const productRouteQuery = await fetchRouteQuery<ProductDetailRouteQuery>(
      environment,
      productDetailRouteQuery,
      { slug },
      { signal: request.signal }
    );
    const product = productRouteQuery.data.product;

    if (!product) {
      productRouteQuery.dispose();

      return {
        status: "not_found"
      };
    }

    try {
      return {
        status: "ready",
        productQuery: productRouteQuery.descriptor,
        offers: await preloadProductOffers(environment, product.id, request.signal)
      };
    } catch (error) {
      productRouteQuery.dispose();
      throw error;
    }
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }

    console.error("Failed to preload product detail route query.", { error });

    return {
      status: "error"
    };
  }
}

async function preloadProductOffers(
  environment: Environment,
  productId: string,
  signal: AbortSignal
): Promise<ProductOffersLoaderData> {
  try {
    return {
      status: "ready",
      query: await preloadRouteQuery<ProductOffersRouteQuery>(
        environment,
        productOffersRouteQuery,
        {
          productId,
          first: PRODUCT_OFFERS_PAGE_SIZE
        },
        { signal }
      )
    };
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }

    console.error("Failed to preload product offers route query.", { error });

    return {
      status: "error"
    };
  }
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
