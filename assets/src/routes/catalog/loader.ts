import type { LoaderFunctionArgs } from "react-router-dom";
import browseProductsRouteQuery, {
  type BrowseProductsRouteQuery
} from "../../__generated__/BrowseProductsRouteQuery.graphql";
import productFilterMetadataQuery, {
  type ProductFilterMetadataQuery
} from "../../__generated__/ProductFilterMetadataQuery.graphql";
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
      metadataQuery: RelayRouteQueryDescriptor<ProductFilterMetadataQuery["variables"]>;
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
  const metadataVariables: ProductFilterMetadataQuery["variables"] = {};
  const after = nonBlankParam(requestUrl, "after");

  if (after) {
    variables.after = after;
  }

  if (productFiltersInput) {
    variables.filters = productFiltersInput;
    metadataVariables.filters = productFiltersInput;
  }

  try {
    const [queryResult, metadataQueryResult] = await Promise.allSettled([
      fetchRouteQuery<BrowseProductsRouteQuery>(
        environment,
        browseProductsRouteQuery,
        variables,
        { signal: request.signal }
      ),
      fetchRouteQuery<ProductFilterMetadataQuery>(
        environment,
        productFilterMetadataQuery,
        metadataVariables,
        { signal: request.signal }
      )
    ]);

    if (queryResult.status === "rejected") {
      if (metadataQueryResult.status === "fulfilled") {
        metadataQueryResult.value.dispose();
      }

      throw queryResult.reason;
    }

    if (metadataQueryResult.status === "rejected") {
      queryResult.value.dispose();

      throw metadataQueryResult.reason;
    }

    return {
      status: "ready",
      filters,
      pageSize,
      query: queryResult.value.descriptor,
      metadataQuery: metadataQueryResult.value.descriptor
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
