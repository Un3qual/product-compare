import {
  Environment,
  Network,
  RecordSource,
  Store,
  type RequestParameters,
  type Variables
} from "relay-runtime";
import { fetchGraphQL, type SSRContext } from "./fetch-graphql";

export type RelayRecordMap = Record<string, Record<string, unknown> | null | undefined>;

export interface CreateRelayEnvironmentOptions {
  records?: RelayRecordMap;
  ssrContext?: SSRContext;
}

export function createRelayEnvironment(options: CreateRelayEnvironmentOptions = {}) {
  const records = (options.records ?? {}) as unknown as ConstructorParameters<typeof RecordSource>[0];
  const recordSource = new RecordSource(records);

  return new Environment({
    network: Network.create((params: RequestParameters, variables: Variables) => {
      if (!params.text) {
        throw new Error(`Relay operation text is missing for request: ${params.name ?? "unknown"}`);
      }

      return fetchGraphQL(params.text, variables as Record<string, unknown>, options.ssrContext);
    }),
    store: new Store(recordSource)
  });
}
