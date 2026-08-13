import {
  type CacheConfig,
  Environment,
  Network,
  RecordSource,
  Store,
  type GraphQLResponse,
  type GraphQLSingularResponse,
  type PayloadError,
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

type GraphQLResponseWithErrors = GraphQLSingularResponse & {
  errors: readonly PayloadError[];
};

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
          throw new Error(`Relay operation text is missing for request: ${params.name}`);
        }

        const routeSignal = routeLoaderSignal(cacheConfig);

        return fetchGraphQL(params.text, variables, {
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

export function hasGraphQLErrors(response: GraphQLResponse): response is GraphQLResponseWithErrors {
  if (!response || typeof response !== "object" || Array.isArray(response)) {
    return false;
  }

  return "errors" in response && Array.isArray(response.errors) && response.errors.length > 0;
}

export function graphQLResponseHasErrorCode(
  response: GraphQLResponse,
  codes: ReadonlySet<string>,
  pathSegment?: string,
) {
  const responses: readonly GraphQLSingularResponse[] = Array.isArray(response)
    ? response
    : [response];

  return responses.some(
    (item) =>
      "errors" in item &&
      Boolean(
        item.errors?.some((error) => {
          const relevantPath =
            !pathSegment ||
            !error.path?.length ||
            error.path.some((segment) => segment === pathSegment);
          const code = graphQLErrorCode(error);

          return relevantPath && typeof code === "string" && codes.has(code.toUpperCase());
        }),
      ),
  );
}

export function formatGraphQLErrorMessage(response: GraphQLResponse) {
  if (!hasGraphQLErrors(response)) {
    return "GraphQL response contained errors";
  }

  const messages =
    response.errors
      ?.map((error) => error.message)
      .filter((message): message is string => typeof message === "string" && message.length > 0) ??
    [];

  return messages.length > 0
    ? `GraphQL response contained errors: ${messages.join("; ")}`
    : "GraphQL response contained errors";
}

function graphQLErrorCode(error: PayloadError) {
  if (!("extensions" in error)) return null;

  const extensions = error.extensions;
  if (!extensions || typeof extensions !== "object" || !("code" in extensions)) return null;

  return typeof extensions.code === "string" ? extensions.code : null;
}
