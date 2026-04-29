import {
  type CacheConfig,
  Environment,
  Network,
  RecordSource,
  Store,
  type RequestParameters,
  type Variables
} from "relay-runtime";
import { fetchGraphQL, type SSRContext } from "./fetch-graphql";
import { RELAY_ROUTE_LOADER_SIGNAL_METADATA_KEY } from "./load-query";

export type RelayRecordMap = NonNullable<ConstructorParameters<typeof RecordSource>[0]>;

export interface CreateRelayEnvironmentOptions {
  records?: RelayRecordMap;
  ssrContext?: SSRContext;
}

export function createRelayEnvironment(options: CreateRelayEnvironmentOptions = {}) {
  const recordSource = new RecordSource(options.records ?? {});

  return new Environment({
    network: Network.create((params: RequestParameters, variables: Variables, cacheConfig: CacheConfig) => {
      if (!params.text) {
        throw new Error(`Relay operation text is missing for request: ${params.name ?? "unknown"}`);
      }

      return fetchGraphQL(
        params.text,
        variables as Record<string, unknown>,
        networkSSRContext(options.ssrContext, cacheConfig)
      );
    }),
    store: new Store(recordSource)
  });
}

function networkSSRContext(ssrContext: SSRContext | undefined, cacheConfig: CacheConfig) {
  const signal = routeLoaderSignal(cacheConfig);

  return {
    ...ssrContext,
    rejectGraphQLErrors: signal ? true : ssrContext?.rejectGraphQLErrors,
    signal
  };
}

function routeLoaderSignal(cacheConfig: CacheConfig) {
  const signal = cacheConfig.metadata?.[RELAY_ROUTE_LOADER_SIGNAL_METADATA_KEY];

  if (typeof AbortSignal !== "undefined" && signal instanceof AbortSignal) {
    return signal;
  }

  return undefined;
}
