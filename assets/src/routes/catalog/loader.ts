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

const BROWSE_PRODUCTS_DEFAULT_PAGE_SIZE = 12;
const BROWSE_PRODUCTS_MAX_PAGE_SIZE = 48;

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
  const requestUrl = new URL(request.url);
  const variables: BrowseProductsRouteQuery["variables"] = {
    first: browseProductsPageSizeFromUrl(requestUrl)
  };
  const after = nonBlankParam(requestUrl, "after");

  if (after) {
    variables.after = after;
  }

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

function browseProductsPageSizeFromUrl(url: URL) {
  const value = nonBlankParam(url, "first");

  if (!value) {
    return BROWSE_PRODUCTS_DEFAULT_PAGE_SIZE;
  }

  if (!/^\d+$/.test(value)) {
    return BROWSE_PRODUCTS_DEFAULT_PAGE_SIZE;
  }

  const parsedValue = Number.parseInt(value, 10);

  return parsedValue >= 1 && parsedValue <= BROWSE_PRODUCTS_MAX_PAGE_SIZE
    ? parsedValue
    : BROWSE_PRODUCTS_DEFAULT_PAGE_SIZE;
}

function nonBlankParam(url: URL, name: string) {
  const value = url.searchParams.get(name)?.trim();

  return value === "" ? null : value ?? null;
}
