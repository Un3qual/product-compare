import { useEffect, useMemo } from "react";
import {
  loadQuery,
  useRelayEnvironment,
  type GraphQLTaggedNode,
  type PreloadedQuery,
} from "react-relay";
import { createContext, RouterContextProvider } from "react-router-dom";
import {
  createOperationDescriptor,
  getRequest,
  type CacheConfig,
  type Disposable,
  type Environment,
  type OperationType,
  type PayloadData,
} from "relay-runtime";
import { fetchAppQuery, RELAY_ROUTE_LOADER_SIGNAL_METADATA_KEY } from "./load-query";

const ROUTE_QUERY_REF_CACHE_LIMIT = 50;

const relayEnvironmentRouterContext = createContext<Environment | null>(null);
const routeQueryRefs = new WeakMap<Environment, Map<string, RouteQueryRefEntry>>();
const routeQueryLeaseHandles = new WeakMap<object, RouteQueryRefEntry>();
const activeRouteQueryLeases = new WeakSet<object>();

interface RouteQueryRefEntry {
  activeLeaseCount: number;
  descriptorKey: string;
  disposeTimer: ReturnType<typeof setTimeout> | null;
  environment: Environment;
  isDisposed: boolean;
  queryRef: Disposable;
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

export interface FetchedRelayRouteQuery<TQuery extends OperationType> {
  data: TQuery["response"];
  descriptor: RelayRouteQueryDescriptor<TQuery["variables"]>;
  dispose: () => void;
}

export async function fetchRouteQuery<TQuery extends OperationType>(
  environment: Environment,
  query: GraphQLTaggedNode,
  variables: TQuery["variables"],
  options: PreloadRouteQueryOptions = {},
): Promise<FetchedRelayRouteQuery<TQuery>> {
  const descriptor = createRouteQueryDescriptor<TQuery>(query, variables);
  const data = await fetchAppQuery<TQuery>(environment, query, variables, {
    fetchPolicy: "network-only",
    ...routeLoaderNetworkOptions(options.signal),
  });

  const queryRef = loadQuery<TQuery>(environment, query, variables, {
    fetchPolicy: "store-only",
  });

  const entry = setRouteQueryRef(environment, descriptor, queryRef);

  return {
    data,
    descriptor,
    dispose: () => disposeFetchedRouteQueryRef(entry),
  };
}

export async function preloadRouteQuery<TQuery extends OperationType>(
  environment: Environment,
  query: GraphQLTaggedNode,
  variables: TQuery["variables"],
  options: PreloadRouteQueryOptions = {},
): Promise<RelayRouteQueryDescriptor<TQuery["variables"]>> {
  const { descriptor } = await fetchRouteQuery<TQuery>(environment, query, variables, options);

  return descriptor;
}

export function cacheRouteQueryData<TQuery extends OperationType>(
  environment: Environment,
  query: GraphQLTaggedNode,
  variables: TQuery["variables"],
  data: TQuery["response"],
) {
  const operation = createOperationDescriptor(getRequest(query), variables);
  environment.commitPayload(operation, data as PayloadData);

  const descriptor = createRouteQueryDescriptor<TQuery>(query, variables);
  const queryRef = loadQuery<TQuery>(environment, query, variables, {
    fetchPolicy: "store-only",
  });

  setRouteQueryRef(environment, descriptor, queryRef);

  return descriptor;
}

export function getRoutePreloadedQuery<TQuery extends OperationType>(
  environment: Environment,
  query: GraphQLTaggedNode,
  descriptor: RelayRouteQueryDescriptor<TQuery["variables"]>,
): PreloadedQuery<TQuery> {
  const descriptorKey = relayRouteQueryDescriptorIdentity(descriptor);
  let routeQueryRefEntry = getRouteQueryRefEntry(environment, descriptorKey);

  if (!routeQueryRefEntry) {
    const queryRef = loadQuery<TQuery>(environment, query, descriptor.__relayQuery.variables, {
      fetchPolicy: "store-only",
    });

    routeQueryRefEntry = setRouteQueryRef(environment, descriptorKey, queryRef);
  }

  return createRouteQueryRefLease<TQuery>(routeQueryRefEntry);
}

export function useRoutePreloadedQuery<TQuery extends OperationType>(
  query: GraphQLTaggedNode,
  descriptor: RelayRouteQueryDescriptor<TQuery["variables"]>,
): PreloadedQuery<TQuery> {
  const environment = useRelayEnvironment();
  const descriptorKey = relayRouteQueryDescriptorIdentity(descriptor);
  const queryRef = useMemo(
    () => getRoutePreloadedQuery<TQuery>(environment, query, descriptor),
    [descriptorKey, environment, query],
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
  const entry = environmentQueryRefs?.get(descriptorKey);

  if (!environmentQueryRefs || !entry) {
    return undefined;
  }

  if (entry.isDisposed) {
    environmentQueryRefs.delete(descriptorKey);
    return undefined;
  }

  environmentQueryRefs.delete(descriptorKey);
  environmentQueryRefs.set(descriptorKey, entry);

  return entry;
}

function createRouteQueryRefLease<TQuery extends OperationType>(entry: RouteQueryRefEntry) {
  const lease = Object.create(entry.queryRef) as PreloadedQuery<TQuery>;

  Object.defineProperty(lease, "dispose", {
    configurable: true,
    value: () => releaseRouteQueryRefLease(lease),
  });
  routeQueryLeaseHandles.set(lease, entry);

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

function activateRouteQueryRefLease<TQuery extends OperationType>(
  queryRef: PreloadedQuery<TQuery>,
) {
  const entry = routeQueryLeaseHandles.get(queryRef);

  if (!entry || entry.isDisposed || activeRouteQueryLeases.has(queryRef)) {
    return;
  }

  cancelRouteQueryRefDisposal(entry);
  activeRouteQueryLeases.add(queryRef);
  entry.activeLeaseCount += 1;
}

function releaseRouteQueryRefLease<TQuery extends OperationType>(queryRef: PreloadedQuery<TQuery>) {
  const entry = routeQueryLeaseHandles.get(queryRef);

  if (!entry || !activeRouteQueryLeases.has(queryRef)) {
    return;
  }

  activeRouteQueryLeases.delete(queryRef);
  entry.activeLeaseCount -= 1;

  if (entry.activeLeaseCount === 0) {
    scheduleRouteQueryRefDisposal(entry);
  }
}

function setRouteQueryRef<TQuery extends OperationType>(
  environment: Environment,
  descriptor: RelayRouteQueryDescriptor<TQuery["variables"]> | string,
  queryRef: PreloadedQuery<TQuery>,
) {
  let environmentQueryRefs = routeQueryRefs.get(environment);

  if (!environmentQueryRefs) {
    environmentQueryRefs = new Map();
    routeQueryRefs.set(environment, environmentQueryRefs);
  }

  const descriptorKey =
    typeof descriptor === "string" ? descriptor : relayRouteQueryDescriptorIdentity(descriptor);
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
    queryRef,
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

function disposeFetchedRouteQueryRef(entry: RouteQueryRefEntry) {
  removeRouteQueryRefEntry(entry);
  disposeInactiveRouteQueryRefEntry(entry);
}

function disposeRouteQueryRefEntry(entry: RouteQueryRefEntry) {
  if (entry.isDisposed) {
    return;
  }

  entry.queryRef.dispose();
  entry.isDisposed = true;
}

function routeLoaderNetworkOptions(
  signal?: AbortSignal,
): { networkCacheConfig: CacheConfig } | Record<string, never> {
  if (!signal) {
    return {};
  }

  return {
    networkCacheConfig: {
      metadata: {
        [RELAY_ROUTE_LOADER_SIGNAL_METADATA_KEY]: signal,
      },
    },
  };
}

function createRouteQueryDescriptor<TQuery extends OperationType>(
  query: GraphQLTaggedNode,
  variables: TQuery["variables"],
) {
  const request = getRequest(query);

  return {
    __relayQuery: {
      operationName: request.params.name,
      text: request.params.text,
      variables,
    },
  };
}

export function relayRouteQueryDescriptorIdentity<TVariables>(
  descriptor: RelayRouteQueryDescriptor<TVariables>,
) {
  return JSON.stringify([
    descriptor.__relayQuery.operationName,
    descriptor.__relayQuery.text,
    stableJsonValue(descriptor.__relayQuery.variables),
  ]);
}

function stableJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stableJsonValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .map(([key, nestedValue]) => [key, stableJsonValue(nestedValue)]),
    );
  }

  return value;
}
