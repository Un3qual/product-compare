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

export function browseLoader({ context }: LoaderFunctionArgs): BrowseProductsLoaderData {
  try {
    const environment = getRelayEnvironmentFromRouterContext(context);

    return {
      status: "ready",
      query: preloadRouteQuery<BrowseProductsRouteQuery>(environment, browseProductsRouteQuery, {
        first: BROWSE_PRODUCTS_PAGE_SIZE
      })
    };
  } catch (error) {
    console.error("Failed to preload browse products route query.", { error });

    return {
      status: "error"
    };
  }
}
