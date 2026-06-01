import type { GraphQLResponse } from "relay-runtime";
import type { LoaderFunctionArgs } from "react-router-dom";
import apiTokensRouteQuery, {
  type ApiTokensRouteQuery
} from "../../../__generated__/ApiTokensRouteQuery.graphql";
import { RouteLoaderGraphQLError } from "../../../relay/environment";
import {
  fetchRouteQuery,
  getRelayEnvironmentFromRouterContext,
  type FetchedRelayRouteQuery,
  type RelayRouteQueryDescriptor
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

export type ApiTokenQueryDescriptor = RelayRouteQueryDescriptor<
  ApiTokensRouteQuery["variables"]
>;

export type ApiTokensRouteLoaderData =
  | {
      status: "ready" | "empty";
      tokenQueries: ApiTokenQueryDescriptor[];
      tokens: ApiTokenSummary[];
      tokenStatus: ApiTokenStatus;
    }
  | {
      status: "unauthorized";
      tokenQueries: [];
      tokens: [];
      tokenStatus: ApiTokenStatus;
    };

type ApiTokenStatusVariable = NonNullable<ApiTokensRouteQuery["variables"]["status"]>;

export const API_TOKENS_PAGE_SIZE = 20;
const API_TOKENS_MAX_PAGES = 50;
const API_TOKENS_AUTH_ERROR_CODES = new Set(["UNAUTHENTICATED"]);
const API_TOKENS_PARSE_ERROR = "Failed to parse API tokens response";
const API_TOKEN_STATUS_VARIABLES: Record<ApiTokenStatus, ApiTokenStatusVariable> = {
  active: "ACTIVE",
  all: "ALL",
  revoked: "REVOKED"
};

export async function apiTokensLoader({
  context,
  request
}: LoaderFunctionArgs): Promise<ApiTokensRouteLoaderData> {
  const environment = getRelayEnvironmentFromRouterContext(context);
  const tokenStatus = parseApiTokenStatus(new URL(request.url).searchParams.get("status"));
  const fetchedPages: Array<FetchedRelayRouteQuery<ApiTokensRouteQuery>> = [];
  const tokenQueries: ApiTokenQueryDescriptor[] = [];
  const tokens: ApiTokenSummary[] = [];
  let after: string | undefined;
  let pageCount = 0;

  try {
    while (true) {
      throwIfAborted(request.signal);

      if (pageCount >= API_TOKENS_MAX_PAGES) {
        throw new Error("API tokens pagination limit exceeded");
      }

      pageCount += 1;
      const fetchedPage = await fetchRouteQuery<ApiTokensRouteQuery>(
        environment,
        apiTokensRouteQuery,
        apiTokensQueryVariables(tokenStatus, after),
        { signal: request.signal }
      );

      fetchedPages.push(fetchedPage);
      tokenQueries.push(fetchedPage.descriptor);

      const page = summarizeApiTokensPage(fetchedPage.data);
      tokens.push(...page.tokens);

      if (!page.hasNextPage) {
        break;
      }

      if (!page.endCursor || page.endCursor === after) {
        throw new Error("Invalid pagination cursor");
      }

      after = page.endCursor;
    }
  } catch (error) {
    disposeFetchedApiTokenPages(fetchedPages);

    if (isUnauthorizedApiTokensError(error)) {
      return {
        status: "unauthorized",
        tokenQueries: [],
        tokens: [],
        tokenStatus: "all"
      };
    }

    throw error;
  }

  return {
    status: tokens.length === 0 ? "empty" : "ready",
    tokenQueries,
    tokens,
    tokenStatus
  };
}

function apiTokensQueryVariables(
  tokenStatus: ApiTokenStatus,
  after: string | undefined
): ApiTokensRouteQuery["variables"] {
  const variables: ApiTokensRouteQuery["variables"] = {
    first: API_TOKENS_PAGE_SIZE,
    status: API_TOKEN_STATUS_VARIABLES[tokenStatus]
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
    endCursor: endCursor ?? null
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
    insertedAt: node.insertedAt
  };
}

function throwApiTokensParseError(): never {
  throw new Error(API_TOKENS_PARSE_ERROR);
}

function disposeFetchedApiTokenPages(
  fetchedPages: Array<FetchedRelayRouteQuery<ApiTokensRouteQuery>>
) {
  for (const fetchedPage of fetchedPages) {
    fetchedPage.dispose();
  }
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
