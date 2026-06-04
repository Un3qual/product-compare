import type { LoaderFunctionArgs } from "react-router-dom";
import browseProductsRouteQuery, {
  type BrowseProductsRouteQuery
} from "../../__generated__/BrowseProductsRouteQuery.graphql";
import {
  getRelayEnvironmentFromRouterContext,
  preloadRouteQuery,
  type RelayRouteQueryDescriptor
} from "../../relay/route-preload";
import { recoverRouteLoaderError } from "../loader-errors";

const BROWSE_PRODUCTS_PAGE_SIZE = 12;

export type BrowseProductsLoaderData =
  | {
      status: "ready";
      query: RelayRouteQueryDescriptor<BrowseProductsRouteQuery["variables"]>;
    }
  | {
      status: "error";
    };

export async function browseLoader({
  context,
  request
}: LoaderFunctionArgs): Promise<BrowseProductsLoaderData> {
  const environment = getRelayEnvironmentFromRouterContext(context);
  const after = new URL(request.url).searchParams.get("after");
  const variables: BrowseProductsRouteQuery["variables"] = after
    ? {
        first: BROWSE_PRODUCTS_PAGE_SIZE,
        after
      }
    : {
        first: BROWSE_PRODUCTS_PAGE_SIZE
      };

  try {
    return {
      status: "ready",
      query: await preloadRouteQuery<BrowseProductsRouteQuery>(
        environment,
        browseProductsRouteQuery,
        variables,
        { signal: request.signal }
      )
    };
  } catch (error) {
    return recoverRouteLoaderError<BrowseProductsLoaderData>(
      error,
      "Failed to preload browse products route query.",
      {
        status: "error"
      }
    );
  }
}
