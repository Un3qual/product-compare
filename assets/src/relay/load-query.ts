import type { GraphQLTaggedNode } from "react-relay";
import { loadQuery } from "react-relay";
import {
  fetchQuery,
  type CacheConfig,
  type Environment,
  type FetchPolicy,
  type FetchQueryFetchPolicy,
  type OperationType
} from "relay-runtime";

export const RELAY_ROUTE_LOADER_SIGNAL_METADATA_KEY = "routeLoaderSignal";

interface LoadAppQueryOptions {
  fetchPolicy?: FetchPolicy | null;
  networkCacheConfig?: CacheConfig | null;
}

interface FetchAppQueryOptions {
  fetchPolicy?: FetchQueryFetchPolicy | null;
  networkCacheConfig?: CacheConfig | null;
}

export async function fetchAppQuery<TQuery extends OperationType>(
  environment: Environment,
  query: GraphQLTaggedNode,
  variables: TQuery["variables"],
  options?: FetchAppQueryOptions
) {
  const response = await fetchQuery<TQuery>(environment, query, variables, options).toPromise();

  if (response === undefined) {
    throw new Error("Relay query completed without data");
  }

  return response;
}

export function loadAppQuery<TQuery extends OperationType>(
  environment: Environment,
  query: GraphQLTaggedNode,
  variables: TQuery["variables"],
  options?: LoadAppQueryOptions
) {
  // Keep a thin wrapper so route loaders can centralize defaults here later.
  return loadQuery<TQuery>(environment, query, variables, options);
}
