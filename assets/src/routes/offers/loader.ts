import type { LoaderFunctionArgs } from "react-router-dom";
import offerDiscoveryRouteQuery, {
  type OfferDiscoveryRouteQuery
} from "../../__generated__/OfferDiscoveryRouteQuery.graphql";
import {
  getRelayEnvironmentFromRouterContext,
  preloadRouteQuery,
  type RelayRouteQueryDescriptor
} from "../../relay/route-preload";
import { recoverRouteLoaderError } from "../loader-errors";

const DEFAULT_OFFERS_PAGE_SIZE = 6;
const MAX_OFFERS_PAGE_SIZE = 50;

export interface OfferDiscoveryFilters {
  activeOnly: boolean;
  after: string | null;
  first: number;
  merchantId: string | null;
  productId: string | null;
}

export type OfferDiscoveryLoaderData =
  | {
      status: "ready";
      filters: OfferDiscoveryFilters;
      query: RelayRouteQueryDescriptor<OfferDiscoveryRouteQuery["variables"]>;
    }
  | {
      status: "missingProduct";
      filters: OfferDiscoveryFilters;
    }
  | {
      status: "error";
      filters: OfferDiscoveryFilters;
    };

export async function offerDiscoveryLoader({
  context,
  request
}: LoaderFunctionArgs): Promise<OfferDiscoveryLoaderData> {
  const environment = getRelayEnvironmentFromRouterContext(context);
  const filters = offerDiscoveryFiltersFromUrl(new URL(request.url));

  if (!filters.productId) {
    return {
      status: "missingProduct",
      filters
    };
  }

  try {
    return {
      status: "ready",
      filters,
      query: await preloadRouteQuery<OfferDiscoveryRouteQuery>(
        environment,
        offerDiscoveryRouteQuery,
        { input: offerDiscoveryInputFromFilters(filters) },
        { signal: request.signal }
      )
    };
  } catch (error) {
    return recoverRouteLoaderError<OfferDiscoveryLoaderData>(
      error,
      "Failed to preload offer discovery route query.",
      {
        status: "error",
        filters
      }
    );
  }
}

export function offerDiscoveryFiltersFromUrl(url: URL): OfferDiscoveryFilters {
  return {
    activeOnly: activeOnlyFromUrl(url),
    after: nonBlankParam(url, "after"),
    first: pageSizeFromUrl(url),
    merchantId: nonBlankParam(url, "merchantId"),
    productId: nonBlankParam(url, "productId")
  };
}

function offerDiscoveryInputFromFilters(filters: OfferDiscoveryFilters) {
  return {
    activeOnly: filters.activeOnly,
    ...(filters.after ? { after: filters.after } : {}),
    first: filters.first,
    ...(filters.merchantId ? { merchantId: filters.merchantId } : {}),
    productId: filters.productId ?? ""
  };
}

function activeOnlyFromUrl(url: URL) {
  const value = nonBlankParam(url, "activeOnly");

  return value !== "false";
}

function pageSizeFromUrl(url: URL) {
  const value = nonBlankParam(url, "first");

  if (!value) {
    return DEFAULT_OFFERS_PAGE_SIZE;
  }

  if (!/^\d+$/.test(value)) {
    return DEFAULT_OFFERS_PAGE_SIZE;
  }

  const parsedValue = Number.parseInt(value, 10);

  if (
    Number.isNaN(parsedValue) ||
    parsedValue < 1 ||
    parsedValue > MAX_OFFERS_PAGE_SIZE
  ) {
    return DEFAULT_OFFERS_PAGE_SIZE;
  }

  return parsedValue;
}

function nonBlankParam(url: URL, name: string) {
  const value = url.searchParams.get(name)?.trim();

  return value === "" ? null : value ?? null;
}
