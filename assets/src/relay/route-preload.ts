import type { GraphQLTaggedNode } from "react-relay";
import { createContext, RouterContextProvider } from "react-router-dom";
import { getRequest, type Environment, type OperationType } from "relay-runtime";
import { loadAppQuery } from "./load-query";

const relayEnvironmentRouterContext = createContext<Environment>();

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
  loadAppQuery<TQuery>(environment, query, variables);

  const request = getRequest(query);

  return {
    __relayQuery: {
      operationName: request.params.name,
      text: request.params.text,
      variables
    }
  };
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
