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
import { recoverRouteLoaderError } from "../loader-errors";

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
  const offersAfter = offersAfterFromUrl(new URL(request.url));

  if (slug === "") {
    return {
      status: "not_found"
    };
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
        offers: await preloadProductOffers(
          environment,
          product.id,
          offersAfter,
          request.signal
        )
      };
    } catch (error) {
      productRouteQuery.dispose();
      throw error;
    }
  } catch (error) {
    return recoverRouteLoaderError<ProductDetailLoaderData>(
      error,
      "Failed to preload product detail route query.",
      {
        status: "error"
      }
    );
  }
}

async function preloadProductOffers(
  environment: Environment,
  productId: string,
  offersAfter: string | null,
  signal: AbortSignal
): Promise<ProductOffersLoaderData> {
  const variables: ProductOffersRouteQuery["variables"] = {
    productId,
    first: PRODUCT_OFFERS_PAGE_SIZE,
    ...(offersAfter ? { after: offersAfter } : {})
  };

  try {
    return {
      status: "ready",
      query: await preloadRouteQuery<ProductOffersRouteQuery>(
        environment,
        productOffersRouteQuery,
        variables,
        { signal }
      )
    };
  } catch (error) {
    return recoverRouteLoaderError<ProductOffersLoaderData>(
      error,
      "Failed to preload product offers route query.",
      {
        status: "error"
      }
    );
  }
}

function offersAfterFromUrl(url: URL): string | null {
  const offersAfter = url.searchParams.get("offersAfter");

  if (offersAfter === null) {
    return null;
  }

  const trimmedOffersAfter = offersAfter.trim();

  return trimmedOffersAfter === "" ? null : trimmedOffersAfter;
}
