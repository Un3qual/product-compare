declare module "react-relay" {
  import type { ComponentType, ReactNode } from "react";
  import type {
    Environment,
    GraphQLTaggedNode as RelayGraphQLTaggedNode,
    OperationType
  } from "relay-runtime";

  export type GraphQLTaggedNode = RelayGraphQLTaggedNode;

  export function graphql(strings: TemplateStringsArray): GraphQLTaggedNode;

  export interface PreloadedQuery<TQuery extends OperationType> {
    readonly variables: TQuery["variables"];
    dispose(): void;
  }

  export const RelayEnvironmentProvider: ComponentType<{
    children?: ReactNode;
    environment: Environment;
  }>;

  export function loadQuery<TQuery extends OperationType>(
    environment: Environment,
    query: GraphQLTaggedNode,
    variables: TQuery["variables"]
  ): PreloadedQuery<TQuery>;

  export function usePreloadedQuery<TQuery extends OperationType>(
    query: GraphQLTaggedNode,
    preloadedQuery: PreloadedQuery<TQuery>
  ): TQuery["response"];

  export function useRelayEnvironment(): Environment;
}
