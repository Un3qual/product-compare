import type { LoaderFunctionArgs } from "react-router-dom";
import productDetailRouteQuery, {
  type ProductDetailRouteQuery
} from "../../__generated__/ProductDetailRouteQuery.graphql";
import {
  fetchRouteQuery,
  getRelayEnvironmentFromRouterContext,
  type RelayRouteQueryDescriptor
} from "../../relay/route-preload";
import { recoverRouteLoaderError } from "../loader-errors";

const PRODUCT_OFFERS_PAGE_SIZE = 6;

export type ProductDetailLoaderData =
  | {
      status: "ready";
      productQuery: RelayRouteQueryDescriptor<ProductDetailRouteQuery["variables"]>;
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
      {
        slug,
        offerFirst: PRODUCT_OFFERS_PAGE_SIZE,
        offersAfter
      },
      { signal: request.signal }
    );

    if (!productRouteQuery.data.product) {
      productRouteQuery.dispose();

      return {
        status: "not_found"
      };
    }

    return {
      status: "ready",
      productQuery: productRouteQuery.descriptor
    };
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

function offersAfterFromUrl(url: URL): string | null {
  return url.searchParams.get("offersAfter");
}
