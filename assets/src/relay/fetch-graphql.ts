import type { GraphQLResponse } from "relay-runtime";

const DEFAULT_DEV_API_BASE_URL = "http://localhost:4000";
const DEFAULT_DEV_API_PORT = "4000";

export interface SSRContext {
  request?: Request;
  headers?: Record<string, string>;
  cookieString?: string;
}

interface ResolveGraphQLEndpointOptions {
  apiBaseUrl?: string | null;
  isDev?: boolean;
  locationOrigin?: string | null;
}

export async function fetchGraphQL(
  query: string,
  variables: Record<string, unknown>,
  ssrContext?: SSRContext
): Promise<GraphQLResponse> {
  let response: Response;

  const headers: Record<string, string> = {
    "content-type": "application/json"
  };

  // For SSR requests, forward cookies from the incoming request
  if (ssrContext) {
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

  try {
    response = await fetch(resolveGraphQLEndpoint(), {
      method: "POST",
      credentials: ssrContext ? undefined : "include", // credentials only for browser
      headers,
      body: JSON.stringify({ query, variables })
    });
  } catch (error) {
    throw new Error(`Network request failed: ${(error as Error).message}`);
  }

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(`GraphQL request failed (${response.status}): ${responseBody}`);
  }

  return response.json();
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
      ssrContext.request?.headers.get("referer")
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
