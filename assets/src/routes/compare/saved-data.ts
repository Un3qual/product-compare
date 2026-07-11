import type { GraphQLResponse } from "relay-runtime";
import type { LoaderFunctionArgs } from "react-router-dom";
import savedComparisonsRouteQuery, {
  type SavedComparisonsRouteQuery
} from "../../__generated__/SavedComparisonsRouteQuery.graphql";
import { RouteLoaderGraphQLError } from "../../relay/environment";
import {
  fetchRouteQuery,
  getRelayEnvironmentFromRouterContext,
  type RelayRouteQueryDescriptor
} from "../../relay/route-preload";
import { isRouteRecord } from "../route-errors";

export interface SavedComparisonSetSummary {
  id: string;
  name: string;
  products: Array<{
    name: string;
    slug: string;
  }>;
}

export type SavedComparisonSetQueryDescriptor = RelayRouteQueryDescriptor<
  SavedComparisonsRouteQuery["variables"]
>;

export type SavedComparisonsRouteLoaderData =
  | {
      status: "ready" | "empty";
      savedSetQueries: SavedComparisonSetQueryDescriptor[];
      savedSets: SavedComparisonSetSummary[];
      after?: string | null;
      hasNextPage?: boolean;
      endCursor?: string | null;
    }
  | {
      status: "unauthorized";
      savedSetQueries: [];
      savedSets: [];
    };

const SAVED_COMPARISON_SETS_PAGE_SIZE = 20;
const SAVED_COMPARISONS_AUTH_ERROR_CODES = new Set(["UNAUTHENTICATED"]);
const SAVED_COMPARISONS_PARSE_ERROR = "Failed to parse saved comparison sets response";

export async function savedComparisonsLoader({
  context,
  request
}: LoaderFunctionArgs): Promise<SavedComparisonsRouteLoaderData> {
  const environment = getRelayEnvironmentFromRouterContext(context);
  const after = nonBlankSearchParam(new URL(request.url).searchParams.get("after"));
  let fetchedPage: Awaited<ReturnType<typeof fetchRouteQuery<SavedComparisonsRouteQuery>>> | null = null;

  try {
    throwIfAborted(request.signal);
    fetchedPage = await fetchRouteQuery<SavedComparisonsRouteQuery>(
      environment,
      savedComparisonsRouteQuery,
      after === null
        ? { first: SAVED_COMPARISON_SETS_PAGE_SIZE }
        : { first: SAVED_COMPARISON_SETS_PAGE_SIZE, after },
      { signal: request.signal }
    );
    throwIfAborted(request.signal);
    const page = summarizeSavedComparisonSetsPage(fetchedPage.data);

    if (page.hasNextPage && (!page.endCursor || page.endCursor === after)) {
      throw new Error("Invalid pagination cursor");
    }

    return {
      status: page.savedSets.length === 0 ? "empty" : "ready",
      savedSetQueries: [fetchedPage.descriptor],
      savedSets: page.savedSets,
      after,
      hasNextPage: page.hasNextPage,
      endCursor: page.endCursor
    };
  } catch (error) {
    fetchedPage?.dispose();

    if (isUnauthorizedSavedComparisonsError(error)) {
      return {
        status: "unauthorized",
        savedSetQueries: [],
        savedSets: []
      };
    }

    throw error;
  }

}

function nonBlankSearchParam(value: string | null) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function throwIfAborted(signal?: AbortSignal) {
  if (!signal?.aborted) {
    return;
  }

  if (signal.reason instanceof Error) {
    throw signal.reason;
  }

  throw new Error("Request aborted");
}

export function summarizeSavedComparisonSetsPage(
  data: unknown
): {
  savedSets: SavedComparisonSetSummary[];
  hasNextPage: boolean;
  endCursor: string | null;
} {
  const connection = isRouteRecord(data) ? data.mySavedComparisonSets : null;

  if (
    !isRouteRecord(connection) ||
    !Array.isArray(connection.edges) ||
    !isRouteRecord(connection.pageInfo)
  ) {
    throwSavedComparisonsParseError();
  }

  const { hasNextPage, endCursor } = connection.pageInfo;

  if (typeof hasNextPage !== "boolean" || !(endCursor == null || typeof endCursor === "string")) {
    throwSavedComparisonsParseError();
  }

  return {
    savedSets: connection.edges.map(summarizeSavedComparisonEdge),
    hasNextPage,
    endCursor: endCursor ?? null
  };
}

function summarizeSavedComparisonEdge(edge: unknown): SavedComparisonSetSummary {
  if (!isRouteRecord(edge)) {
    throwSavedComparisonsParseError();
  }

  return summarizeSavedComparisonSet(edge.node);
}

function summarizeSavedComparisonSet(node: unknown): SavedComparisonSetSummary {
  if (
    !isRouteRecord(node) ||
    typeof node.id !== "string" ||
    typeof node.name !== "string" ||
    !Array.isArray(node.items)
  ) {
    throwSavedComparisonsParseError();
  }

  return {
    id: node.id,
    name: node.name,
    products: node.items
      .map(summarizeSavedComparisonItem)
      .sort((left, right) => left.position - right.position)
      .map(({ name, slug }) => ({ name, slug }))
  };
}

function summarizeSavedComparisonItem(
  item: unknown
): { name: string; position: number; slug: string } {
  if (
    !isRouteRecord(item) ||
    typeof item.position !== "number" ||
    !isRouteRecord(item.product)
  ) {
    throwSavedComparisonsParseError();
  }

  const { name, slug } = item.product;

  if (typeof name !== "string" || typeof slug !== "string") {
    throwSavedComparisonsParseError();
  }

  return {
    name,
    position: item.position,
    slug
  };
}

function throwSavedComparisonsParseError(): never {
  throw new Error(SAVED_COMPARISONS_PARSE_ERROR);
}

export function isUnauthorizedSavedComparisonsError(error: unknown) {
  if (!(error instanceof RouteLoaderGraphQLError)) {
    return false;
  }

  return isUnauthorizedSavedComparisonsResponse(error.response);
}

export function isUnauthorizedSavedComparisonsResponse(response: GraphQLResponse) {
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
        (error.path.length === 0 ||
          error.path.some((segment) => segment === "mySavedComparisonSets")));

    if (!isRelevantPath) {
      return false;
    }

    const extensions = error.extensions;
    if (isRouteRecord(extensions)) {
      const code = extensions.code;
      if (typeof code === "string") {
        return SAVED_COMPARISONS_AUTH_ERROR_CODES.has(code.toUpperCase());
      }
    }

    return false;
  });
}
