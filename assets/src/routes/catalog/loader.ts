import type { LoaderFunctionArgs } from "react-router-dom";
import browseProductsRouteQuery, {
  type BrowseProductsRouteQuery
} from "../../__generated__/BrowseProductsRouteQuery.graphql";
import {
  fetchRouteQuery,
  getRelayEnvironmentFromRouterContext,
  type RelayRouteQueryDescriptor
} from "../../relay/route-preload";
import { recoverRouteLoaderError } from "../loader-errors";
import {
  catalogFiltersFromUrl,
  catalogFiltersToProductFiltersInput,
  type CatalogFilters
} from "./filters";

const BROWSE_PRODUCTS_DEFAULT_PAGE_SIZE = 12;
const BROWSE_PRODUCTS_PAGE_SIZES = [12, 24, 48] as const;
type BrowseProductsPageSize = (typeof BROWSE_PRODUCTS_PAGE_SIZES)[number];

export type BrowseProductsLoaderData =
  | {
      status: "ready";
      filters: CatalogFilters;
      pageSize: BrowseProductsPageSize;
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
  const filters = catalogFiltersFromUrl(requestUrl);
  const productFiltersInput = catalogFiltersToProductFiltersInput(filters);
  const pageSize = browseProductsPageSizeFromUrl(requestUrl);
  const variables: BrowseProductsRouteQuery["variables"] = {
    first: pageSize
  };
  const after = nonBlankParam(requestUrl, "after");

  if (after) {
    variables.after = after;
  }

  if (productFiltersInput) {
    variables.filters = productFiltersInput;
  }

  try {
    const queryResult = await fetchRouteQuery<BrowseProductsRouteQuery>(
      environment,
      browseProductsRouteQuery,
      variables,
      { signal: request.signal }
    );

    return {
      status: "ready",
      filters,
      pageSize,
      query: queryResult.descriptor
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

  if (value === null) {
    return BROWSE_PRODUCTS_DEFAULT_PAGE_SIZE;
  }

  if (!/^\d+$/.test(value)) {
    return BROWSE_PRODUCTS_DEFAULT_PAGE_SIZE;
  }

  const parsedValue = Number.parseInt(value, 10);

  return isBrowseProductsPageSize(parsedValue)
    ? parsedValue
    : BROWSE_PRODUCTS_DEFAULT_PAGE_SIZE;
}

function isBrowseProductsPageSize(value: number): value is BrowseProductsPageSize {
  return BROWSE_PRODUCTS_PAGE_SIZES.includes(value as BrowseProductsPageSize);
}

function nonBlankParam(url: URL, name: string) {
  const rawValue = url.searchParams.get(name);

  if (rawValue === null) {
    return null;
  }

  const value = rawValue.trim();

  return value === "" ? null : value;
}
