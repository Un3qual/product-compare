import type { LoaderFunctionArgs } from "react-router-dom";
import revenueSummaryRouteQuery, {
  type RevenueSummaryRouteQuery
} from "../../../__generated__/RevenueSummaryRouteQuery.graphql";
import {
  getRelayEnvironmentFromRouterContext,
  preloadRouteQuery,
  type RelayRouteQueryDescriptor
} from "../../../relay/route-preload";
import { recoverRouteLoaderError } from "../../loader-errors";

const DATE_FILTER_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const NETWORK_FILTER_PATTERN = /^[a-z0-9_-]+$/;

export interface RevenueSummaryFilters {
  currency?: string;
  from?: string;
  network?: string;
  to?: string;
}

export type RevenueSummaryLoaderData =
  | {
      status: "ready";
      filters: RevenueSummaryFilters;
      query: RelayRouteQueryDescriptor<RevenueSummaryRouteQuery["variables"]>;
    }
  | {
      status: "error";
      filters: RevenueSummaryFilters;
    };

export async function revenueSummaryLoader({
  context,
  request
}: LoaderFunctionArgs): Promise<RevenueSummaryLoaderData> {
  const environment = getRelayEnvironmentFromRouterContext(context);
  const filters = revenueSummaryFiltersFromUrl(new URL(request.url));

  try {
    return {
      status: "ready",
      filters,
      query: await preloadRouteQuery<RevenueSummaryRouteQuery>(
        environment,
        revenueSummaryRouteQuery,
        {
          input: Object.keys(filters).length > 0 ? filters : null
        },
        { signal: request.signal }
      )
    };
  } catch (error) {
    return recoverRouteLoaderError<RevenueSummaryLoaderData>(
      error,
      "Failed to preload revenue summary route query.",
      {
        status: "error",
        filters
      }
    );
  }
}

export function revenueSummaryFiltersFromUrl(url: URL): RevenueSummaryFilters {
  const filters = {
    currency: normalizeCurrencyFilter(url.searchParams.get("currency")),
    from: normalizeDateFilter(url.searchParams.get("from")),
    network: normalizeNetworkFilter(url.searchParams.get("network")),
    to: normalizeDateFilter(url.searchParams.get("to"))
  };

  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined)
  ) as RevenueSummaryFilters;
}

function normalizeCurrencyFilter(value: string | null) {
  const normalized = value?.trim().toUpperCase();

  return normalized && /^[A-Z]{3}$/.test(normalized) ? normalized : undefined;
}

function normalizeDateFilter(value: string | null) {
  const normalized = value?.trim();

  return normalized && DATE_FILTER_PATTERN.test(normalized) ? normalized : undefined;
}

function normalizeNetworkFilter(value: string | null) {
  const normalized = value?.trim().toLowerCase();

  return normalized && NETWORK_FILTER_PATTERN.test(normalized) ? normalized : undefined;
}
