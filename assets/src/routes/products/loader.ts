import { data, type LoaderFunctionArgs } from "react-router-dom";
import productDetailRouteQuery, {
  type ProductDetailRouteQuery
} from "../../__generated__/ProductDetailRouteQuery.graphql";
import { RouteLoaderGraphQLError } from "../../relay/environment";
import {
  cacheRouteQueryData,
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

export type ProductDetailLoaderResult =
  | ProductDetailLoaderData
  | ReturnType<typeof data<ProductDetailLoaderData>>;

export async function productDetailLoader({
  context,
  params,
  request
}: LoaderFunctionArgs): Promise<ProductDetailLoaderResult> {
  const slug = params.slug?.trim() ?? "";
  const offersAfter = offersAfterFromUrl(new URL(request.url));

  if (slug === "") {
    return productNotFoundResult();
  }

  const environment = getRelayEnvironmentFromRouterContext(context);
  const variables: ProductDetailRouteQuery["variables"] = {
    slug,
    offerFirst: PRODUCT_OFFERS_PAGE_SIZE,
    offersAfter
  };

  try {
    const productRouteQuery = await fetchRouteQuery<ProductDetailRouteQuery>(
      environment,
      productDetailRouteQuery,
      variables,
      { signal: request.signal }
    );

    if (!productRouteQuery.data.product) {
      productRouteQuery.dispose();

      return productNotFoundResult();
    }

    return {
      status: "ready",
      productQuery: productRouteQuery.descriptor
    };
  } catch (error) {
    const partialData = partialProductData(error);

    if (partialData) {
      return {
        status: "ready",
        productQuery: cacheRouteQueryData<ProductDetailRouteQuery>(
          environment,
          productDetailRouteQuery,
          variables,
          partialData
        )
      };
    }

    return recoverRouteLoaderError<ProductDetailLoaderData>(
      error,
      "Failed to preload product detail route query.",
      {
        status: "error"
      }
    );
  }
}

function productNotFoundResult() {
  return data<ProductDetailLoaderData>(
    {
      status: "not_found"
    },
    { status: 404 }
  );
}

function offersAfterFromUrl(url: URL): string | null {
  return url.searchParams.get("offersAfter");
}

function partialProductData(error: unknown): ProductDetailRouteQuery["response"] | null {
  if (!(error instanceof RouteLoaderGraphQLError)) {
    return null;
  }

  const response = error.response;

  if (Array.isArray(response) || !("data" in response)) {
    return null;
  }

  const data = response.data as ProductDetailRouteQuery["response"] | null | undefined;

  return data?.product ? data : null;
}
