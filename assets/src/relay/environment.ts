import {
  type CacheConfig,
  Environment,
  Network,
  RecordSource,
  Store,
  type GraphQLResponse,
  type RequestParameters,
  type Variables,
} from "relay-runtime";
import { fetchGraphQL, type SSRContext } from "./fetch-graphql";
import { RELAY_ROUTE_LOADER_SIGNAL_METADATA_KEY } from "./load-query";

export type RelayRecordMap = NonNullable<ConstructorParameters<typeof RecordSource>[0]>;

export interface CreateRelayEnvironmentOptions {
  records?: RelayRecordMap;
  ssrContext?: SSRContext;
}

export class RouteLoaderGraphQLError extends Error {
  readonly response: GraphQLResponse;

  constructor(response: GraphQLResponse) {
    super(formatGraphQLErrorMessage(response));
    this.name = "RouteLoaderGraphQLError";
    this.response = response;
  }
}

export function createRelayEnvironment(options: CreateRelayEnvironmentOptions = {}) {
  const recordSource = new RecordSource(options.records ?? {});

  return new Environment({
    network: Network.create(
      (params: RequestParameters, variables: Variables, cacheConfig: CacheConfig) => {
        if (!params.text) {
          throw new Error(
            `Relay operation text is missing for request: ${params.name ?? "unknown"}`,
          );
        }

        const routeSignal = routeLoaderSignal(cacheConfig);

        return fetchGraphQL(params.text, variables as Record<string, unknown>, {
          ...options.ssrContext,
          signal: routeSignal ?? options.ssrContext?.signal,
        }).then((response) => {
          if (routeSignal && hasGraphQLErrors(response)) {
            throw new RouteLoaderGraphQLError(response);
          }

          return response;
        });
      },
    ),
    store: new Store(recordSource),
  });
}

function routeLoaderSignal(cacheConfig: CacheConfig) {
  const signal = cacheConfig.metadata?.[RELAY_ROUTE_LOADER_SIGNAL_METADATA_KEY];

  if (typeof AbortSignal !== "undefined" && signal instanceof AbortSignal) {
    return signal;
  }

  return undefined;
}

export function hasGraphQLErrors(response: GraphQLResponse) {
  if (!response || typeof response !== "object" || Array.isArray(response)) {
    return false;
  }

  return "errors" in response && Array.isArray(response.errors) && response.errors.length > 0;
}

export function formatGraphQLErrorMessage(response: GraphQLResponse) {
  if (!hasGraphQLErrors(response)) {
    return "GraphQL response contained errors";
  }

  const errors = (response as { errors?: Array<{ message?: unknown }> }).errors;
  const messages =
    errors
      ?.map((error) => (typeof error.message === "string" ? error.message : null))
      .filter((message): message is string => message !== null) ?? [];

  return messages.length > 0
    ? `GraphQL response contained errors: ${messages.join("; ")}`
    : "GraphQL response contained errors";
}
