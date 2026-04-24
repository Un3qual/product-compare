import { useMemo } from "react";
import type { GraphQLTaggedNode } from "react-relay";
import { useRelayEnvironment, type PreloadedQuery } from "react-relay";
import { createContext, RouterContextProvider } from "react-router-dom";
import { getRequest, type Environment, type OperationType } from "relay-runtime";
import { loadAppQuery } from "./load-query";

const relayEnvironmentRouterContext = createContext<Environment>();
const routeQueryRefs = new WeakMap<Environment, Map<string, PreloadedQuery<OperationType>>>();

export interface RelayRouteQueryDescriptor<TVariables = Record<string, unknown>> {
  __relayQuery: {
    operationName: string;
    text: string | null;
    variables: TVariables;
  };
}

export function preloadRouteQuery<TQuery extends OperationType>(
  environment: Environment,
  query: GraphQLTaggedNode,
  variables: TQuery["variables"]
): RelayRouteQueryDescriptor<TQuery["variables"]> {
  const request = getRequest(query);
  const descriptor = {
    __relayQuery: {
      operationName: request.params.name,
      text: request.params.text,
      variables
    }
  };
  const queryRef = loadAppQuery<TQuery>(environment, query, variables);

  setRouteQueryRef(environment, descriptor, queryRef);

  return descriptor;
}

export function getRoutePreloadedQuery<TQuery extends OperationType>(
  environment: Environment,
  query: GraphQLTaggedNode,
  descriptor: RelayRouteQueryDescriptor<TQuery["variables"]>
): PreloadedQuery<TQuery> {
  const existingQueryRef = getRouteQueryRef(environment, descriptor);

  if (existingQueryRef) {
    return existingQueryRef as PreloadedQuery<TQuery>;
  }

  const queryRef = loadAppQuery<TQuery>(environment, query, descriptor.__relayQuery.variables);

  setRouteQueryRef(environment, descriptor, queryRef);

  return queryRef;
}

export function useRoutePreloadedQuery<TQuery extends OperationType>(
  query: GraphQLTaggedNode,
  descriptor: RelayRouteQueryDescriptor<TQuery["variables"]>
): PreloadedQuery<TQuery> {
  const environment = useRelayEnvironment();
  const descriptorKey = routeQueryDescriptorKey(descriptor);

  return useMemo(
    () => getRoutePreloadedQuery<TQuery>(environment, query, descriptor),
    [descriptor, descriptorKey, environment, query]
  );
}

export function createRelayRouterContext(environment: Environment) {
  const context = new RouterContextProvider();
  context.set(relayEnvironmentRouterContext, environment);

  return context;
}

export function getRelayEnvironmentFromRouterContext(context: unknown) {
  if (context instanceof RouterContextProvider) {
    return context.get(relayEnvironmentRouterContext);
  }

  throw new Error("Relay environment is missing from the route loader context");
}

function getRouteQueryRef<TQuery extends OperationType>(
  environment: Environment,
  descriptor: RelayRouteQueryDescriptor<TQuery["variables"]>
) {
  return routeQueryRefs.get(environment)?.get(routeQueryDescriptorKey(descriptor));
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

  environmentQueryRefs.set(routeQueryDescriptorKey(descriptor), queryRef as PreloadedQuery<OperationType>);
}

function routeQueryDescriptorKey<TVariables>(descriptor: RelayRouteQueryDescriptor<TVariables>) {
  return JSON.stringify([
    descriptor.__relayQuery.operationName,
    descriptor.__relayQuery.text,
    descriptor.__relayQuery.variables
  ]);
}
