declare module "react-relay" {
  import type { ComponentType, ReactNode } from "react";
  import type { Environment, OperationType } from "relay-runtime";

  export type GraphQLTaggedNode = unknown;

  export const RelayEnvironmentProvider: ComponentType<{
    children?: ReactNode;
    environment: Environment;
  }>;

  export function loadQuery<TQuery extends OperationType>(
    environment: Environment,
    query: GraphQLTaggedNode,
    variables: TQuery["variables"]
  ): unknown;
}
