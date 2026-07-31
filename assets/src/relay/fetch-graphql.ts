import * as Micro from "effect/Micro";
import type { GraphQLResponse } from "relay-runtime";

const DEFAULT_DEV_API_BASE_URL = "http://localhost:4000";
const DEFAULT_DEV_API_PORT = "4000";

export interface SSRContext {
  request?: Request;
  headers?: Record<string, string>;
  cookieString?: string;
  signal?: AbortSignal;
}

interface ResolveGraphQLEndpointOptions {
  apiBaseUrl?: string | null;
  isDev?: boolean;
  locationOrigin?: string | null;
}

interface GraphQLTransportOptions {
  endpoint?: ResolveGraphQLEndpointOptions;
  fetch?: typeof globalThis.fetch;
}

export interface GraphQLConfigurationFailure {
  readonly _tag: "GraphQLConfigurationFailure";
  readonly cause: unknown;
  readonly message: string;
}

export interface GraphQLNetworkFailure {
  readonly _tag: "GraphQLNetworkFailure";
  readonly cause: unknown;
  readonly message: string;
}

export interface GraphQLHTTPFailure {
  readonly _tag: "GraphQLHTTPFailure";
  readonly body: string;
  readonly status: number;
}

export interface GraphQLResponseDecodingFailure {
  readonly _tag: "GraphQLResponseDecodingFailure";
  readonly cause: unknown;
}

export interface GraphQLAbortFailure {
  readonly _tag: "GraphQLAbortFailure";
  readonly cause: unknown;
}

export type GraphQLTransportFailure =
  | GraphQLAbortFailure
  | GraphQLConfigurationFailure
  | GraphQLHTTPFailure
  | GraphQLNetworkFailure
  | GraphQLResponseDecodingFailure;

export function fetchGraphQL(
  query: string,
  variables: Record<string, unknown>,
  ssrContext?: SSRContext,
): Promise<GraphQLResponse> {
  return Micro.runPromise(Micro.either(graphqlTransportEffect(query, variables, ssrContext))).then(
    (result) => {
      if (result._tag === "Left") {
        throw promiseFailure(result.left);
      }

      return result.right;
    },
  );
}

/** @internal Exposed only for focused transport contract tests. */
export function graphqlTransportEffect(
  query: string,
  variables: Record<string, unknown>,
  ssrContext?: SSRContext,
  options: GraphQLTransportOptions = {},
) {
  const usesSSRContext = hasSSRContext(ssrContext);
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };

  if (usesSSRContext && ssrContext) {
    const cookieValue =
      ssrContext.cookieString ??
      ssrContext.request?.headers.get("cookie") ??
      ssrContext.headers?.cookie;

    const trustedOrigin = resolveSSRRequestOrigin(ssrContext);

    if (cookieValue) {
      headers.cookie = cookieValue;
    }

    if (trustedOrigin) {
      headers.origin = trustedOrigin;
    }
  }

  return Micro.try({
    try: () => resolveGraphQLEndpoint(options.endpoint),
    catch: configurationFailure,
  }).pipe(
    Micro.flatMap((endpoint) =>
      Micro.tryPromise({
        try: () =>
          (options.fetch ?? globalThis.fetch)(endpoint, {
            method: "POST",
            credentials: usesSSRContext ? undefined : "include",
            headers,
            body: JSON.stringify({ query, variables }),
            signal: ssrContext?.signal ?? ssrContext?.request?.signal,
          }),
        catch: requestFailure,
      }),
    ),
    Micro.flatMap(responseEffect),
  );
}

export function resolveGraphQLEndpoint(options: ResolveGraphQLEndpointOptions = {}) {
  const apiBaseUrl = normalizeApiBaseUrl(options.apiBaseUrl ?? import.meta.env.VITE_API_BASE_URL);

  if (apiBaseUrl) {
    return `${apiBaseUrl}/api/graphql`;
  }

  if (options.isDev ?? import.meta.env.DEV) {
    return `${resolveDevApiBaseUrl(options.locationOrigin)}/api/graphql`;
  }

  throw new Error("VITE_API_BASE_URL must be set outside local development");
}

function resolveDevApiBaseUrl(locationOrigin = currentLocationOrigin()) {
  try {
    const devApiUrl = new URL(locationOrigin ?? DEFAULT_DEV_API_BASE_URL);
    devApiUrl.port = DEFAULT_DEV_API_PORT;
    devApiUrl.pathname = "";
    devApiUrl.search = "";
    devApiUrl.hash = "";
    return devApiUrl.origin;
  } catch {
    return DEFAULT_DEV_API_BASE_URL;
  }
}

function currentLocationOrigin() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.location.origin;
}

function normalizeApiBaseUrl(value?: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.trim();

  if (normalized === "") {
    return null;
  }

  return normalized.replace(/\/+$/, "");
}

function resolveSSRRequestOrigin(ssrContext: SSRContext) {
  return normalizeOrigin(
    ssrContext.headers?.origin ??
      ssrContext.request?.headers.get("origin") ??
      ssrContext.request?.url ??
      ssrContext.headers?.referer ??
      ssrContext.request?.headers.get("referer"),
  );
}

function normalizeOrigin(value?: string | null) {
  if (!value) {
    return null;
  }

  try {
    const parsed = new URL(value);

    return parsed.origin;
  } catch {
    return null;
  }
}

function hasSSRContext(ssrContext?: SSRContext) {
  return Boolean(ssrContext?.request || ssrContext?.headers || ssrContext?.cookieString);
}

function decodeResponse<A>(decode: () => Promise<A>) {
  return Micro.tryPromise({
    try: decode,
    catch: responseDecodingFailure,
  });
}

function promiseFailure(failure: GraphQLTransportFailure): unknown {
  switch (failure._tag) {
    case "GraphQLAbortFailure":
    case "GraphQLResponseDecodingFailure":
      return failure.cause;
    case "GraphQLConfigurationFailure":
    case "GraphQLNetworkFailure":
      return new Error(`Network request failed: ${failure.message}`);
    case "GraphQLHTTPFailure":
      return new Error(`GraphQL request failed (${failure.status}): ${failure.body}`);
  }
}

function errorMessage(cause: unknown) {
  return cause instanceof Error ? cause.message : "Unknown error";
}

function isAbortFailure(cause: unknown) {
  return (
    (cause instanceof DOMException && cause.name === "AbortError") ||
    (cause !== null && typeof cause === "object" && "name" in cause && cause.name === "AbortError")
  );
}

function isGraphQLResponse(value: unknown): value is GraphQLResponse {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function responseEffect(response: Response) {
  if (!response.ok) {
    return decodeResponse(() => response.text()).pipe(
      Micro.flatMap((body) =>
        Micro.fail<GraphQLHTTPFailure>({
          _tag: "GraphQLHTTPFailure",
          body,
          status: response.status,
        }),
      ),
    );
  }

  return decodeResponse(() => response.json()).pipe(
    Micro.flatMap((body) =>
      isGraphQLResponse(body)
        ? Micro.succeed(body)
        : Micro.fail(responseDecodingFailure(new TypeError("GraphQL response must be an object"))),
    ),
  );
}

function configurationFailure(cause: unknown): GraphQLConfigurationFailure {
  return {
    _tag: "GraphQLConfigurationFailure",
    cause,
    message: errorMessage(cause),
  };
}

function requestFailure(cause: unknown): GraphQLAbortFailure | GraphQLNetworkFailure {
  return isAbortFailure(cause)
    ? { _tag: "GraphQLAbortFailure", cause }
    : {
        _tag: "GraphQLNetworkFailure",
        cause,
        message: errorMessage(cause),
      };
}

function responseDecodingFailure(cause: unknown): GraphQLResponseDecodingFailure {
  return {
    _tag: "GraphQLResponseDecodingFailure",
    cause,
  };
}
