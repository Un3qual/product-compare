import type { GraphQLResponse } from "relay-runtime";

export interface SSRContext {
  request?: Request;
  headers?: Record<string, string>;
  cookieString?: string;
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

    if (cookieValue) {
      headers.cookie = cookieValue;
    }
  }

  try {
    response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? ""}/api/graphql`, {
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