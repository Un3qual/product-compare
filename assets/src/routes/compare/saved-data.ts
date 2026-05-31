import type { GraphQLResponse } from "relay-runtime";
import type { LoaderFunctionArgs } from "react-router-dom";
import savedComparisonsRouteQuery, {
  type SavedComparisonsRouteQuery
} from "../../__generated__/SavedComparisonsRouteQuery.graphql";
import { RouteLoaderGraphQLError } from "../../relay/environment";
import {
  fetchRouteQuery,
  getRelayEnvironmentFromRouterContext,
  type FetchedRelayRouteQuery,
  type RelayRouteQueryDescriptor
} from "../../relay/route-preload";
import { isRouteRecord } from "../route-records";

export interface SavedComparisonSetSummary {
  id: string;
  name: string;
  slugs: string[];
}

export type SavedComparisonSetQueryDescriptor = RelayRouteQueryDescriptor<
  SavedComparisonsRouteQuery["variables"]
>;

export type SavedComparisonsRouteLoaderData =
  | {
      status: "ready" | "empty";
      savedSetQueries: SavedComparisonSetQueryDescriptor[];
      savedSets: SavedComparisonSetSummary[];
    }
  | {
      status: "unauthorized";
      savedSetQueries: [];
      savedSets: [];
    };

const SAVED_COMPARISON_SETS_PAGE_SIZE = 20;
const SAVED_COMPARISON_SETS_MAX_PAGES = 50;
const SAVED_COMPARISONS_AUTH_ERROR_CODES = new Set(["UNAUTHENTICATED"]);
const SAVED_COMPARISONS_PARSE_ERROR = "Failed to parse saved comparison sets response";

export async function savedComparisonsLoader({
  context,
  request
}: LoaderFunctionArgs): Promise<SavedComparisonsRouteLoaderData> {
  const environment = getRelayEnvironmentFromRouterContext(context);
  const fetchedPages: Array<FetchedRelayRouteQuery<SavedComparisonsRouteQuery>> = [];
  const savedSetQueries: SavedComparisonSetQueryDescriptor[] = [];
  const savedSets: SavedComparisonSetSummary[] = [];
  let after: string | undefined;
  let pageCount = 0;

  try {
    while (true) {
      throwIfAborted(request.signal);

      if (pageCount >= SAVED_COMPARISON_SETS_MAX_PAGES) {
        throw new Error("Saved comparison sets pagination limit exceeded");
      }

      pageCount += 1;
      const fetchedPage = await fetchRouteQuery<SavedComparisonsRouteQuery>(
        environment,
        savedComparisonsRouteQuery,
        after === undefined
          ? { first: SAVED_COMPARISON_SETS_PAGE_SIZE }
          : { first: SAVED_COMPARISON_SETS_PAGE_SIZE, after },
        { signal: request.signal }
      );
      fetchedPages.push(fetchedPage);
      savedSetQueries.push(fetchedPage.descriptor);

      const page = summarizeSavedComparisonSetsPage(fetchedPage.data);

      savedSets.push(...page.savedSets);

      if (!page.hasNextPage) {
        break;
      }

      if (!page.endCursor || page.endCursor === after) {
        throw new Error("Invalid pagination cursor");
      }

      after = page.endCursor;
    }
  } catch (error) {
    disposeFetchedSavedComparisonPages(fetchedPages);

    if (isUnauthorizedSavedComparisonsError(error)) {
      return {
        status: "unauthorized",
        savedSetQueries: [],
        savedSets: []
      };
    }

    throw error;
  }

  return {
    status: savedSets.length === 0 ? "empty" : "ready",
    savedSetQueries,
    savedSets
  };
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
    slugs: node.items
      .map(summarizeSavedComparisonItem)
      .sort((left, right) => left.position - right.position)
      .map((item) => item.slug)
  };
}

function summarizeSavedComparisonItem(item: unknown): { position: number; slug: string } {
  if (
    !isRouteRecord(item) ||
    typeof item.position !== "number" ||
    !isRouteRecord(item.product)
  ) {
    throwSavedComparisonsParseError();
  }

  const slug = item.product.slug;

  if (typeof slug !== "string") {
    throwSavedComparisonsParseError();
  }

  return {
    position: item.position,
    slug
  };
}

function throwSavedComparisonsParseError(): never {
  throw new Error(SAVED_COMPARISONS_PARSE_ERROR);
}

function disposeFetchedSavedComparisonPages(
  fetchedPages: Array<FetchedRelayRouteQuery<SavedComparisonsRouteQuery>>
) {
  for (const fetchedPage of fetchedPages) {
    fetchedPage.dispose();
  }
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
