import type { LoaderFunctionArgs } from "react-router-dom";
import merchantDirectoryRouteQuery, {
  type MerchantDirectoryRouteQuery
} from "../../__generated__/MerchantDirectoryRouteQuery.graphql";
import {
  getRelayEnvironmentFromRouterContext,
  preloadRouteQuery,
  type RelayRouteQueryDescriptor
} from "../../relay/route-preload";
import { recoverRouteLoaderError } from "../loader-errors";

const MERCHANT_DIRECTORY_DEFAULT_PAGE_SIZE = 20;
const MERCHANT_DIRECTORY_MAX_PAGE_SIZE = 50;

export interface MerchantDirectoryPagination {
  after: string | null;
  first: number;
}

export type MerchantDirectoryLoaderData =
  | {
      status: "ready";
      pagination: MerchantDirectoryPagination;
      query: RelayRouteQueryDescriptor<MerchantDirectoryRouteQuery["variables"]>;
    }
  | {
      status: "error";
      pagination: MerchantDirectoryPagination;
    };

export async function merchantDirectoryLoader({
  context,
  request
}: LoaderFunctionArgs): Promise<MerchantDirectoryLoaderData> {
  const environment = getRelayEnvironmentFromRouterContext(context);
  const pagination = merchantDirectoryPaginationFromUrl(new URL(request.url));

  try {
    return {
      status: "ready",
      pagination,
      query: await preloadRouteQuery<MerchantDirectoryRouteQuery>(
        environment,
        merchantDirectoryRouteQuery,
        pagination,
        { signal: request.signal }
      )
    };
  } catch (error) {
    return recoverRouteLoaderError<MerchantDirectoryLoaderData>(
      error,
      "Failed to preload merchant directory route query.",
      {
        status: "error",
        pagination
      }
    );
  }
}

export function merchantDirectoryPaginationFromUrl(url: URL): MerchantDirectoryPagination {
  return {
    first: normalizeMerchantDirectoryPageSize(url.searchParams.get("first")),
    after: normalizeMerchantDirectoryCursor(url.searchParams.get("after"))
  };
}

function normalizeMerchantDirectoryPageSize(value: string | null) {
  const normalized = value?.trim();

  if (!normalized || !/^\d+$/.test(normalized)) {
    return MERCHANT_DIRECTORY_DEFAULT_PAGE_SIZE;
  }

  const pageSize = Number(normalized);

  return pageSize >= 1 && pageSize <= MERCHANT_DIRECTORY_MAX_PAGE_SIZE
    ? pageSize
    : MERCHANT_DIRECTORY_DEFAULT_PAGE_SIZE;
}

function normalizeMerchantDirectoryCursor(value: string | null) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}
