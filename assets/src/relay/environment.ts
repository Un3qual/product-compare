import {
  Environment,
  Network,
  RecordSource,
  Store,
  type RequestParameters,
  type Variables
} from "relay-runtime";
import { fetchGraphQL, type SSRContext } from "./fetch-graphql";

export function createRelayEnvironment(ssrContext?: SSRContext) {
  return new Environment({
    network: Network.create((params: RequestParameters, variables: Variables) => {
      if (!params.text) {
        throw new Error(`Relay operation text is missing for request: ${params.name ?? "unknown"}`);
      }

      return fetchGraphQL(params.text, variables as Record<string, unknown>, ssrContext);
    }),
    store: new Store(new RecordSource())
  });
}