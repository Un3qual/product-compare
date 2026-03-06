import type { GraphQLTaggedNode } from "react-relay";
import { loadQuery } from "react-relay";
import type { Environment, OperationType } from "relay-runtime";

export function loadAppQuery<TQuery extends OperationType>(
  environment: Environment,
  query: GraphQLTaggedNode,
  variables: TQuery["variables"]
) {
  return loadQuery<TQuery>(environment, query, variables);
}
