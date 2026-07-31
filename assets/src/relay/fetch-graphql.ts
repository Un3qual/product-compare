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

export function fetchGraphQL(
  query: string,
  variables: Record<string, unknown>,
  ssrContext?: SSRContext,
): Promise<GraphQLResponse> {
  return graphqlTransport(query, variables, ssrContext);
}

/** @internal Exposed only for focused transport contract tests. */
export async function graphqlTransport(
  query: string,
  variables: Record<string, unknown>,
  ssrContext?: SSRContext,
  options: GraphQLTransportOptions = {},
): Promise<GraphQLResponse> {
  let endpoint: string;

  try {
    endpoint = resolveGraphQLEndpoint(options.endpoint);
  } catch (cause) {
    throw networkRequestFailure(cause);
  }

  let response: Response;

  try {
    response = await (options.fetch ?? globalThis.fetch)(
      endpoint,
      graphQLRequest(query, variables, ssrContext),
    );
  } catch (cause) {
    if (isAbortFailure(cause)) {
      throw cause;
    }

    throw networkRequestFailure(cause);
  }

  if (!response.ok) {
    const body = await response.text();

    throw new Error(`GraphQL request failed (${response.status}): ${body}`);
  }

  const body: unknown = await response.json();

  if (!isGraphQLResponse(body)) {
    throw new TypeError("GraphQL response must be an object");
  }

  return body;
}

function graphQLRequest(
  query: string,
  variables: Record<string, unknown>,
  ssrContext?: SSRContext,
): RequestInit {
  const usesSSRContext = hasSSRContext(ssrContext);

  return {
    method: "POST",
    credentials: usesSSRContext ? undefined : "include",
    headers: graphQLRequestHeaders(usesSSRContext ? ssrContext : undefined),
    body: JSON.stringify({ query, variables }),
    signal: ssrContext?.signal ?? ssrContext?.request?.signal,
  };
}

function graphQLRequestHeaders(ssrContext?: SSRContext) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };

  if (!ssrContext) {
    return headers;
  }

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

  return headers;
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

function networkRequestFailure(cause: unknown) {
  return new Error(`Network request failed: ${errorMessage(cause)}`);
}
