import type { GraphQLResponse } from "relay-runtime";
import type { LoaderFunctionArgs } from "react-router-dom";
import apiTokensRouteQuery, {
  type ApiTokensRouteQuery,
} from "../../../__generated__/ApiTokensRouteQuery.graphql";
import { RouteLoaderGraphQLError } from "../../../relay/environment";
import {
  fetchRouteQuery,
  getRelayEnvironmentFromRouterContext,
  type RelayRouteQueryDescriptor,
} from "../../../relay/route-preload";
import { isRouteRecord } from "../../route-errors";

export type ApiTokenStatus = "active" | "revoked" | "all";

export interface ApiTokenSummary {
  id: string;
  label: string | null;
  tokenPrefix: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  insertedAt: string;
}

export type ApiTokenQueryDescriptor = RelayRouteQueryDescriptor<ApiTokensRouteQuery["variables"]>;

export type ApiTokensRouteLoaderData =
  | {
      status: "ready" | "empty";
      tokenQueries: ApiTokenQueryDescriptor[];
      tokens: ApiTokenSummary[];
      tokenStatus: ApiTokenStatus;
      after?: string | null;
      hasNextPage?: boolean;
      endCursor?: string | null;
    }
  | {
      status: "unauthorized";
      tokenQueries: [];
      tokens: [];
      tokenStatus: ApiTokenStatus;
    };

type ApiTokenStatusVariable = NonNullable<ApiTokensRouteQuery["variables"]["status"]>;

export const API_TOKENS_PAGE_SIZE = 20;
const API_TOKENS_AUTH_ERROR_CODES = new Set(["UNAUTHENTICATED"]);
const API_TOKENS_PARSE_ERROR = "Failed to parse API tokens response";
const API_TOKEN_STATUS_VARIABLES: Record<ApiTokenStatus, ApiTokenStatusVariable> = {
  active: "ACTIVE",
  all: "ALL",
  revoked: "REVOKED",
};

export async function apiTokensLoader({
  context,
  request,
}: LoaderFunctionArgs): Promise<ApiTokensRouteLoaderData> {
  const environment = getRelayEnvironmentFromRouterContext(context);
  const searchParams = new URL(request.url).searchParams;
  const tokenStatus = parseApiTokenStatus(searchParams.get("status"));
  const after = nonBlankSearchParam(searchParams.get("after"));
  let fetchedPage: Awaited<ReturnType<typeof fetchRouteQuery<ApiTokensRouteQuery>>> | null = null;

  try {
    throwIfAborted(request.signal);
    fetchedPage = await fetchRouteQuery<ApiTokensRouteQuery>(
      environment,
      apiTokensRouteQuery,
      apiTokensQueryVariables(tokenStatus, after ?? undefined),
      { signal: request.signal },
    );
    throwIfAborted(request.signal);
    const page = summarizeApiTokensPage(fetchedPage.data);

    if (page.hasNextPage && (!page.endCursor || page.endCursor === after)) {
      throw new Error("Invalid pagination cursor");
    }

    return {
      status: page.tokens.length === 0 ? "empty" : "ready",
      tokenQueries: [fetchedPage.descriptor],
      tokens: page.tokens,
      tokenStatus,
      after,
      hasNextPage: page.hasNextPage,
      endCursor: page.endCursor,
    };
  } catch (error) {
    fetchedPage?.dispose();

    if (isUnauthorizedApiTokensError(error)) {
      return {
        status: "unauthorized",
        tokenQueries: [],
        tokens: [],
        tokenStatus: "all",
      };
    }

    throw error;
  }
}

function nonBlankSearchParam(value: string | null) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function apiTokensQueryVariables(
  tokenStatus: ApiTokenStatus,
  after: string | undefined,
): ApiTokensRouteQuery["variables"] {
  const variables: ApiTokensRouteQuery["variables"] = {
    first: API_TOKENS_PAGE_SIZE,
    status: API_TOKEN_STATUS_VARIABLES[tokenStatus],
  };

  if (after !== undefined) {
    variables.after = after;
  }

  return variables;
}

function parseApiTokenStatus(status: string | null): ApiTokenStatus {
  if (status === null) {
    return "all";
  }

  const normalizedStatus = status.toLowerCase();

  if (
    normalizedStatus === "active" ||
    normalizedStatus === "revoked" ||
    normalizedStatus === "all"
  ) {
    return normalizedStatus;
  }

  return "all";
}

function throwIfAborted(signal?: AbortSignal) {
  if (!signal?.aborted) {
    return;
  }

  if (signal.reason !== undefined) {
    throw normalizeAbortReason(signal.reason);
  }

  throw new Error("Request aborted");
}

function normalizeAbortReason(reason: unknown) {
  if (reason instanceof Error) {
    return reason;
  }

  return new Error(String(reason));
}

export function summarizeApiTokensPage(data: unknown): {
  tokens: ApiTokenSummary[];
  hasNextPage: boolean;
  endCursor: string | null;
} {
  const connection = isRouteRecord(data) ? data.myApiTokens : null;

  if (
    !isRouteRecord(connection) ||
    !Array.isArray(connection.edges) ||
    !isRouteRecord(connection.pageInfo)
  ) {
    throwApiTokensParseError();
  }

  const { hasNextPage, endCursor } = connection.pageInfo;

  if (typeof hasNextPage !== "boolean" || !(endCursor == null || typeof endCursor === "string")) {
    throwApiTokensParseError();
  }

  return {
    tokens: connection.edges.map(summarizeApiTokenEdge),
    hasNextPage,
    endCursor: endCursor ?? null,
  };
}

function summarizeApiTokenEdge(edge: unknown): ApiTokenSummary {
  if (!isRouteRecord(edge)) {
    throwApiTokensParseError();
  }

  return summarizeApiToken(edge.node);
}

function summarizeApiToken(node: unknown): ApiTokenSummary {
  if (
    !isRouteRecord(node) ||
    typeof node.id !== "string" ||
    !(node.label == null || typeof node.label === "string") ||
    typeof node.tokenPrefix !== "string" ||
    !(node.lastUsedAt == null || typeof node.lastUsedAt === "string") ||
    !(node.expiresAt == null || typeof node.expiresAt === "string") ||
    !(node.revokedAt == null || typeof node.revokedAt === "string") ||
    typeof node.insertedAt !== "string"
  ) {
    throwApiTokensParseError();
  }

  return {
    id: node.id,
    label: node.label ?? null,
    tokenPrefix: node.tokenPrefix,
    lastUsedAt: node.lastUsedAt ?? null,
    expiresAt: node.expiresAt ?? null,
    revokedAt: node.revokedAt ?? null,
    insertedAt: node.insertedAt,
  };
}

function throwApiTokensParseError(): never {
  throw new Error(API_TOKENS_PARSE_ERROR);
}

export function isUnauthorizedApiTokensError(error: unknown) {
  if (!(error instanceof RouteLoaderGraphQLError)) {
    return false;
  }

  return isUnauthorizedApiTokensResponse(error.response);
}

export function isUnauthorizedApiTokensResponse(response: GraphQLResponse) {
  if (!response || typeof response !== "object" || Array.isArray(response)) {
    return false;
  }

  if (!("errors" in response) || !Array.isArray(response.errors)) {
    return false;
  }

  return response.errors.some((error) => {
    if (!isRouteRecord(error)) {
      return false;
    }

    const isRelevantPath =
      error.path == null ||
      (Array.isArray(error.path) &&
        (error.path.length === 0 || error.path.some((segment) => segment === "myApiTokens")));

    if (!isRelevantPath) {
      return false;
    }

    const extensions = error.extensions;
    if (isRouteRecord(extensions)) {
      const code = extensions.code;
      if (typeof code === "string") {
        return API_TOKENS_AUTH_ERROR_CODES.has(code.toUpperCase());
      }
    }

    return false;
  });
}
