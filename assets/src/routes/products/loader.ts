import { data, redirect, type LoaderFunctionArgs } from "react-router-dom";
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
import { routeMetadataFromSeo } from "../seo";
import type { RouteDocumentMetadata } from "../RouteMetadata";

const PRODUCT_OFFERS_PAGE_SIZE = 6;

export type ProductDetailLoaderData =
  | {
      status: "ready";
      metadata: RouteDocumentMetadata;
      productQuery: RelayRouteQueryDescriptor<ProductDetailRouteQuery["variables"]>;
    }
  | {
      status: "not_found" | "error";
    };

export type ProductDetailLoaderResult =
  | ProductDetailLoaderData
  | ReturnType<typeof data<ProductDetailLoaderData>>
  | Response;

type ProductDetailResponseWithProduct = ProductDetailRouteQuery["response"] & {
  product: NonNullable<ProductDetailRouteQuery["response"]["product"]>;
};

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

    if (productRouteQuery.data.product.slug !== slug) {
      productRouteQuery.dispose();
      const canonicalUrl = new URL(request.url);
      canonicalUrl.pathname = `/products/${encodeURIComponent(productRouteQuery.data.product.slug)}`;
      return redirect(`${canonicalUrl.pathname}${canonicalUrl.search}`, 301);
    }

    return {
      status: "ready",
      metadata: routeMetadataFromSeo(productRouteQuery.data.product.seo, request.url, {
        allowIndexing: new URL(request.url).search === ""
      }),
      productQuery: productRouteQuery.descriptor
    };
  } catch (error) {
    const partialData = partialProductData(error);

    if (partialData) {
      return {
        status: "ready",
        metadata: routeMetadataFromSeo(partialData.product.seo, request.url, {
          allowIndexing: new URL(request.url).search === ""
        }),
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

function partialProductData(
  error: unknown
): ProductDetailResponseWithProduct | null {
  if (!(error instanceof RouteLoaderGraphQLError)) {
    return null;
  }

  const response = error.response;

  if (Array.isArray(response) || !("data" in response)) {
    return null;
  }

  const data = response.data as ProductDetailRouteQuery["response"] | null | undefined;

  return hasProduct(data) ? data : null;
}

function hasProduct(
  data: ProductDetailRouteQuery["response"] | null | undefined
): data is ProductDetailResponseWithProduct {
  return data?.product !== null && data?.product !== undefined;
}
