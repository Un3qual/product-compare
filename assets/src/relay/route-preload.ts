import { useEffect, useMemo } from "react";
import type { GraphQLTaggedNode } from "react-relay";
import { useRelayEnvironment, type PreloadedQuery } from "react-relay";
import { createContext, RouterContextProvider } from "react-router-dom";
import { getRequest, type CacheConfig, type Environment, type OperationType } from "relay-runtime";
import { fetchAppQuery, loadAppQuery, RELAY_ROUTE_LOADER_SIGNAL_METADATA_KEY } from "./load-query";

const ROUTE_QUERY_REF_CACHE_LIMIT = 20;

const relayEnvironmentRouterContext = createContext<Environment | null>(null);
const routeQueryRefs = new WeakMap<Environment, Map<string, PreloadedQuery<OperationType>>>();

export interface RelayRouteQueryDescriptor<TVariables = Record<string, unknown>> {
  __relayQuery: {
    operationName: string;
    text: string | null;
    variables: TVariables;
  };
}

interface PreloadRouteQueryOptions {
  signal?: AbortSignal;
}

export async function preloadRouteQuery<TQuery extends OperationType>(
  environment: Environment,
  query: GraphQLTaggedNode,
  variables: TQuery["variables"],
  options: PreloadRouteQueryOptions = {}
): Promise<RelayRouteQueryDescriptor<TQuery["variables"]>> {
  const request = getRequest(query);
  const descriptor = {
    __relayQuery: {
      operationName: request.params.name,
      text: request.params.text,
      variables
    }
  };

  await fetchAppQuery<TQuery>(environment, query, variables, {
    fetchPolicy: "network-only",
    ...routeLoaderNetworkOptions(options.signal)
  });

  const queryRef = loadAppQuery<TQuery>(environment, query, variables, {
    fetchPolicy: "store-only"
  });

  setRouteQueryRef(environment, descriptor, queryRef);

  return descriptor;
}

export function getRoutePreloadedQuery<TQuery extends OperationType>(
  environment: Environment,
  query: GraphQLTaggedNode,
  descriptor: RelayRouteQueryDescriptor<TQuery["variables"]>
): PreloadedQuery<TQuery> {
  const existingQueryRef = takeRouteQueryRef(environment, descriptor);

  if (existingQueryRef) {
    return existingQueryRef as PreloadedQuery<TQuery>;
  }

  return loadAppQuery<TQuery>(environment, query, descriptor.__relayQuery.variables);
}

export function useRoutePreloadedQuery<TQuery extends OperationType>(
  query: GraphQLTaggedNode,
  descriptor: RelayRouteQueryDescriptor<TQuery["variables"]>
): PreloadedQuery<TQuery> {
  const environment = useRelayEnvironment();
  const descriptorKey = routeQueryDescriptorKey(descriptor);
  const queryRef = useMemo(
    () => getRoutePreloadedQuery<TQuery>(environment, query, descriptor),
    [descriptorKey, environment, query]
  );

  useEffect(() => () => queryRef.dispose(), [queryRef]);

  return queryRef;
}

export function createRelayRouterContext(environment: Environment) {
  const context = new RouterContextProvider();
  context.set(relayEnvironmentRouterContext, environment);

  return context;
}

export function getRelayEnvironmentFromRouterContext(context: unknown) {
  if (!(context instanceof RouterContextProvider)) {
    throw new Error("Relay environment is missing from the route loader context");
  }

  const environment = context.get(relayEnvironmentRouterContext);

  if (!environment) {
    throw new Error("Relay environment is missing from the route loader context");
  }

  return environment;
}

function takeRouteQueryRef<TQuery extends OperationType>(
  environment: Environment,
  descriptor: RelayRouteQueryDescriptor<TQuery["variables"]>
) {
  const environmentQueryRefs = routeQueryRefs.get(environment);
  const descriptorKey = routeQueryDescriptorKey(descriptor);
  const queryRef = environmentQueryRefs?.get(descriptorKey);

  if (queryRef) {
    environmentQueryRefs?.delete(descriptorKey);
  }

  return queryRef;
}

function setRouteQueryRef<TQuery extends OperationType>(
  environment: Environment,
  descriptor: RelayRouteQueryDescriptor<TQuery["variables"]>,
  queryRef: PreloadedQuery<TQuery>
) {
  let environmentQueryRefs = routeQueryRefs.get(environment);

  if (!environmentQueryRefs) {
    environmentQueryRefs = new Map();
    routeQueryRefs.set(environment, environmentQueryRefs);
  }

  const descriptorKey = routeQueryDescriptorKey(descriptor);
  const existingQueryRef = environmentQueryRefs.get(descriptorKey);

  if (existingQueryRef === queryRef) {
    return;
  }

  if (existingQueryRef) {
    existingQueryRef.dispose();
    environmentQueryRefs.delete(descriptorKey);
  }

  environmentQueryRefs.set(descriptorKey, queryRef as PreloadedQuery<OperationType>);
  evictRouteQueryRefs(environmentQueryRefs);
}

function evictRouteQueryRefs(environmentQueryRefs: Map<string, PreloadedQuery<OperationType>>) {
  while (environmentQueryRefs.size > ROUTE_QUERY_REF_CACHE_LIMIT) {
    const oldestEntry = environmentQueryRefs.entries().next().value;

    if (!oldestEntry) {
      return;
    }

    const [descriptorKey, queryRef] = oldestEntry;
    environmentQueryRefs.delete(descriptorKey);
    queryRef.dispose();
  }
}

function routeLoaderNetworkOptions(signal?: AbortSignal): { networkCacheConfig: CacheConfig } | Record<string, never> {
  if (!signal) {
    return {};
  }

  return {
    networkCacheConfig: {
      metadata: {
        [RELAY_ROUTE_LOADER_SIGNAL_METADATA_KEY]: signal
      }
    }
  };
}

function routeQueryDescriptorKey<TVariables>(descriptor: RelayRouteQueryDescriptor<TVariables>) {
  return JSON.stringify([
    descriptor.__relayQuery.operationName,
    descriptor.__relayQuery.text,
    stableJsonValue(descriptor.__relayQuery.variables)
  ]);
}

function stableJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stableJsonValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .map(([key, nestedValue]) => [key, stableJsonValue(nestedValue)])
    );
  }

  return value;
}
