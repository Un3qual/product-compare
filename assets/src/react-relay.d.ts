declare module "react-relay" {
  import type { ComponentType, ReactNode } from "react";
  import type {
    Environment,
    GraphQLTaggedNode as RelayGraphQLTaggedNode,
    OperationType
  } from "relay-runtime";

  export type GraphQLTaggedNode = RelayGraphQLTaggedNode;

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
}
