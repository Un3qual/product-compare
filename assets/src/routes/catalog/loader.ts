import type { LoaderFunctionArgs } from "react-router-dom";
import browseProductsRouteQuery, {
  type BrowseProductsRouteQuery
} from "../../__generated__/BrowseProductsRouteQuery.graphql";
import {
  getRelayEnvironmentFromRouterContext,
  preloadRouteQuery,
  type RelayRouteQueryDescriptor
} from "../../relay/route-preload";

const BROWSE_PRODUCTS_PAGE_SIZE = 12;

export type BrowseProductsLoaderData =
  | {
      status: "ready";
      query: RelayRouteQueryDescriptor<BrowseProductsRouteQuery["variables"]>;
    }
  | {
      status: "error";
    };

export async function browseLoader({ context, request }: LoaderFunctionArgs): Promise<BrowseProductsLoaderData> {
  try {
    const environment = getRelayEnvironmentFromRouterContext(context);

    return {
      status: "ready",
      query: await preloadRouteQuery<BrowseProductsRouteQuery>(
        environment,
        browseProductsRouteQuery,
        {
          first: BROWSE_PRODUCTS_PAGE_SIZE
        },
        { signal: request.signal }
      )
    };
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }

    console.error("Failed to preload browse products route query.", { error });

    return {
      status: "error"
    };
  }
}

function isAbortError(error: unknown) {
  if (error instanceof DOMException) {
    return error.name === "AbortError";
  }

  return hasErrorName(error, "AbortError");
}

function hasErrorName(error: unknown, name: string) {
  return Boolean(error && typeof error === "object" && "name" in error && error.name === name);
}
