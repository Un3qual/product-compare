import {
  Environment,
  Network,
  RecordSource,
  Store,
  type RequestParameters,
  type Variables
} from "relay-runtime";
import { fetchGraphQL } from "./fetch-graphql";

export function createRelayEnvironment() {
  return new Environment({
    network: Network.create((params: RequestParameters, variables: Variables) =>
      fetchGraphQL(params.text ?? "", variables as Record<string, unknown>)
    ),
    store: new Store(new RecordSource())
  });
}
