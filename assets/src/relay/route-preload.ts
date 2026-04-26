import { useEffect, useMemo } from "react";
import type { GraphQLTaggedNode } from "react-relay";
import { useRelayEnvironment, type PreloadedQuery } from "react-relay";
import { createContext, RouterContextProvider } from "react-router-dom";
import { getRequest, type CacheConfig, type Environment, type OperationType } from "relay-runtime";
import { fetchAppQuery, loadAppQuery, RELAY_ROUTE_LOADER_SIGNAL_METADATA_KEY } from "./load-query";

const ROUTE_QUERY_REF_CACHE_LIMIT = 20;

const relayEnvironmentRouterContext = createContext<Environment | null>(null);
const routeQueryRefs = new WeakMap<Environment, Map<string, RouteQueryRefEntry>>();
const routeQueryLeaseHandles = new WeakMap<PreloadedQuery<OperationType>, RouteQueryRefEntry>();
const activeRouteQueryLeases = new WeakSet<PreloadedQuery<OperationType>>();

interface RouteQueryRefEntry {
  activeLeaseCount: number;
  descriptorKey: string;
  disposeTimer: ReturnType<typeof setTimeout> | null;
  environment: Environment;
  isDisposed: boolean;
  queryRef: PreloadedQuery<OperationType>;
}

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
  const descriptorKey = routeQueryDescriptorKey(descriptor);
  let routeQueryRefEntry = getRouteQueryRefEntry(environment, descriptorKey);

  if (!routeQueryRefEntry) {
    const queryRef = loadAppQuery<TQuery>(environment, query, descriptor.__relayQuery.variables, {
      fetchPolicy: "store-only"
    });

    routeQueryRefEntry = setRouteQueryRef(environment, descriptorKey, queryRef);
  }

  return createRouteQueryRefLease<TQuery>(routeQueryRefEntry);
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

  useEffect(() => {
    activateRouteQueryRefLease(queryRef);

    return () => queryRef.dispose();
  }, [queryRef]);

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

function getRouteQueryRefEntry(environment: Environment, descriptorKey: string) {
  const environmentQueryRefs = routeQueryRefs.get(environment);

  return environmentQueryRefs?.get(descriptorKey);
}

function createRouteQueryRefLease<TQuery extends OperationType>(entry: RouteQueryRefEntry) {
  const lease = Object.create(entry.queryRef) as PreloadedQuery<TQuery>;

  Object.defineProperty(lease, "dispose", {
    configurable: true,
    value: () => releaseRouteQueryRefLease(lease)
  });
  routeQueryLeaseHandles.set(lease as PreloadedQuery<OperationType>, entry);

  return lease;
}

const scheduleRouteQueryRefDisposal = (entry: RouteQueryRefEntry) => {
  if (entry.disposeTimer !== null) {
    return;
  }

  entry.disposeTimer = setTimeout(() => {
    entry.disposeTimer = null;

    if (entry.activeLeaseCount > 0) {
      return;
    }

    removeRouteQueryRefEntry(entry);
    disposeRouteQueryRefEntry(entry);
  }, 0);
};

const cancelRouteQueryRefDisposal = (entry: RouteQueryRefEntry) => {
  if (entry.disposeTimer === null) {
    return;
  }

  clearTimeout(entry.disposeTimer);
  entry.disposeTimer = null;
};

function activateRouteQueryRefLease<TQuery extends OperationType>(queryRef: PreloadedQuery<TQuery>) {
  const lease = queryRef as PreloadedQuery<OperationType>;
  const entry = routeQueryLeaseHandles.get(lease);

  if (!entry || activeRouteQueryLeases.has(lease)) {
    return;
  }

  cancelRouteQueryRefDisposal(entry);
  activeRouteQueryLeases.add(lease);
  entry.activeLeaseCount += 1;
}

function releaseRouteQueryRefLease<TQuery extends OperationType>(queryRef: PreloadedQuery<TQuery>) {
  const lease = queryRef as PreloadedQuery<OperationType>;
  const entry = routeQueryLeaseHandles.get(lease);

  if (!entry || !activeRouteQueryLeases.has(lease)) {
    return;
  }

  activeRouteQueryLeases.delete(lease);
  entry.activeLeaseCount -= 1;

  if (entry.activeLeaseCount === 0) {
    scheduleRouteQueryRefDisposal(entry);
  }
}

function setRouteQueryRef<TQuery extends OperationType>(
  environment: Environment,
  descriptor: RelayRouteQueryDescriptor<TQuery["variables"]> | string,
  queryRef: PreloadedQuery<TQuery>
) {
  let environmentQueryRefs = routeQueryRefs.get(environment);

  if (!environmentQueryRefs) {
    environmentQueryRefs = new Map();
    routeQueryRefs.set(environment, environmentQueryRefs);
  }

  const descriptorKey = typeof descriptor === "string" ? descriptor : routeQueryDescriptorKey(descriptor);
  const existingEntry = environmentQueryRefs.get(descriptorKey);

  if (existingEntry?.queryRef === queryRef) {
    return existingEntry;
  }

  if (existingEntry) {
    environmentQueryRefs.delete(descriptorKey);
    disposeInactiveRouteQueryRefEntry(existingEntry);
  }

  const entry = {
    activeLeaseCount: 0,
    descriptorKey,
    disposeTimer: null,
    environment,
    isDisposed: false,
    queryRef: queryRef as PreloadedQuery<OperationType>
  };

  environmentQueryRefs.set(descriptorKey, entry);
  evictRouteQueryRefs(environmentQueryRefs);

  return entry;
}

function evictRouteQueryRefs(environmentQueryRefs: Map<string, RouteQueryRefEntry>) {
  while (environmentQueryRefs.size > ROUTE_QUERY_REF_CACHE_LIMIT) {
    const oldestEntry = environmentQueryRefs.entries().next().value;

    if (!oldestEntry) {
      return;
    }

    const [descriptorKey, entry] = oldestEntry;
    environmentQueryRefs.delete(descriptorKey);
    disposeInactiveRouteQueryRefEntry(entry);
  }
}

function removeRouteQueryRefEntry(entry: RouteQueryRefEntry) {
  const environmentQueryRefs = routeQueryRefs.get(entry.environment);

  if (environmentQueryRefs?.get(entry.descriptorKey) === entry) {
    environmentQueryRefs.delete(entry.descriptorKey);
  }
}

function disposeInactiveRouteQueryRefEntry(entry: RouteQueryRefEntry) {
  if (entry.activeLeaseCount > 0) {
    return;
  }

  cancelRouteQueryRefDisposal(entry);
  disposeRouteQueryRefEntry(entry);
}

function disposeRouteQueryRefEntry(entry: RouteQueryRefEntry) {
  if (entry.isDisposed) {
    return;
  }

  entry.queryRef.dispose();
  entry.isDisposed = true;
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
