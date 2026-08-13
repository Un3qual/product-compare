import type { GraphQLTaggedNode } from "react-relay";
import {
  fetchQuery,
  type CacheConfig,
  type Environment,
  type FetchQueryFetchPolicy,
  type OperationType,
} from "relay-runtime";

export const RELAY_ROUTE_LOADER_SIGNAL_METADATA_KEY = "routeLoaderSignal";

interface FetchAppQueryOptions {
  fetchPolicy?: FetchQueryFetchPolicy | null;
  networkCacheConfig?: CacheConfig | null;
}

export async function fetchAppQuery<TQuery extends OperationType>(
  environment: Environment,
  query: GraphQLTaggedNode,
  variables: TQuery["variables"],
  options?: FetchAppQueryOptions,
) {
  const response = await fetchQuery<TQuery>(environment, query, variables, options).toPromise();

  if (response === undefined) {
    throw new Error("Relay query completed without data");
  }

  return response;
}
