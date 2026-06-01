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
import {
  merchantPaginationFromUrl,
  type MerchantPagination
} from "./pagination";

export type MerchantDirectoryPagination = MerchantPagination;

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
  const pagination = merchantPaginationFromUrl(new URL(request.url));

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
