import type { GraphQLResponse } from "relay-runtime";
import type { LoaderFunctionArgs } from "react-router-dom";
import savedComparisonsRouteQuery, {
  type SavedComparisonsRouteQuery
} from "../../__generated__/SavedComparisonsRouteQuery.graphql";
import { fetchGraphQL } from "../../relay/fetch-graphql";
import {
  fetchRouteQuery,
  getRelayEnvironmentFromRouterContext,
  type FetchedRelayRouteQuery,
  type RelayRouteQueryDescriptor
} from "../../relay/route-preload";

export interface CompareMutationError {
  code: string;
  field?: string | null;
  message: string;
}

export interface SavedComparisonSetSummary {
  id: string;
  name: string;
  slugs: string[];
}

export interface DeleteSavedComparisonSetResult {
  savedComparisonSetId: string | null;
  errors: CompareMutationError[];
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

const DELETE_SAVED_COMPARISON_SET_MUTATION = `
  mutation DeleteSavedComparisonSet($savedComparisonSetId: ID!) {
    deleteSavedComparisonSet(savedComparisonSetId: $savedComparisonSetId) {
      savedComparisonSet {
        id
      }
      errors {
        code
        field
        message
      }
    }
  }
`;

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

    if (isAbortError(error)) {
      throw error;
    }

    throw error;
  }

  return {
    status: savedSets.length === 0 ? "empty" : "ready",
    savedSetQueries,
    savedSets
  };
}

export async function deleteSavedComparisonSet(
  savedComparisonSetId: string
): Promise<DeleteSavedComparisonSetResult> {
  const response = await fetchGraphQL(
    DELETE_SAVED_COMPARISON_SET_MUTATION,
    {
      savedComparisonSetId
    },
    undefined
  );
  const payload = readMutationPayload(response, "deleteSavedComparisonSet");
  const deletedSavedComparisonSetId = readSavedComparisonSetId(payload.savedComparisonSet);
  const errors = normalizeMutationErrors(payload.errors, response);

  return {
    savedComparisonSetId: deletedSavedComparisonSetId,
    errors: deletedSavedComparisonSetId ? errors : ensureFailureErrors(errors)
  };
}

function readMutationPayload(response: GraphQLResponse, fieldName: string) {
  if (
    !Array.isArray(response) &&
    "data" in response &&
    response.data &&
    typeof response.data === "object" &&
    !Array.isArray(response.data)
  ) {
    const payload = (response.data as Record<string, unknown>)[fieldName];

    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
      return payload as Record<string, unknown>;
    }
  }

  return {};
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
  data: SavedComparisonsRouteQuery["response"]
): {
  savedSets: SavedComparisonSetSummary[];
  hasNextPage: boolean;
  endCursor: string | null;
} {
  const connection = data.mySavedComparisonSets;

  if (!connection || !Array.isArray(connection.edges) || !connection.pageInfo) {
    throw new Error("Failed to parse saved comparison sets response");
  }

  return {
    savedSets: connection.edges.map((edge) => summarizeSavedComparisonSet(edge.node)),
    hasNextPage: connection.pageInfo.hasNextPage,
    endCursor: connection.pageInfo.endCursor ?? null
  };
}

function summarizeSavedComparisonSet(
  node: SavedComparisonsRouteQuery["response"]["mySavedComparisonSets"]["edges"][number]["node"]
): SavedComparisonSetSummary {
  return {
    id: node.id,
    name: node.name,
    slugs: [...node.items]
      .sort((left, right) => left.position - right.position)
      .map((item) => item.product.slug)
  };
}

function disposeFetchedSavedComparisonPages(
  fetchedPages: Array<FetchedRelayRouteQuery<SavedComparisonsRouteQuery>>
) {
  for (const fetchedPage of fetchedPages) {
    fetchedPage.dispose();
  }
}

export function isUnauthorizedSavedComparisonsError(error: unknown) {
  if (!error || typeof error !== "object" || !("message" in error)) {
    return false;
  }

  const message = typeof error.message === "string" ? error.message.toLowerCase() : "";
  const authKeywords = ["unauth", "not authenticated", "not authorized", "access denied"];

  return authKeywords.some((keyword) => message.includes(keyword));
}

function isAbortError(error: unknown) {
  return getErrorName(error) === "AbortError";
}

function getErrorName(error: unknown) {
  if (!error || typeof error !== "object" || !("name" in error)) {
    return null;
  }

  return error.name;
}

export function isUnauthorizedSavedComparisonsResponse(response: GraphQLResponse) {
  // TODO: Once the backend emits structured error codes consistently,
  // remove fuzzy message checks and rely solely on extensions.code
  if (!response || typeof response !== "object" || Array.isArray(response)) {
    return false;
  }

  if (!("errors" in response) || !Array.isArray(response.errors)) {
    return false;
  }

  return response.errors.some((error) => {
    if (!error || typeof error !== "object" || Array.isArray(error)) {
      return false;
    }

    const candidate = error as unknown as Record<string, unknown>;
    const isRelevantPath =
      candidate.path == null ||
      (Array.isArray(candidate.path) &&
        (candidate.path.length === 0 ||
          candidate.path.some((segment) => segment === "mySavedComparisonSets")));

    if (!isRelevantPath) {
      return false;
    }

    const extensions = candidate.extensions;
    if (extensions && typeof extensions === "object" && !Array.isArray(extensions)) {
      const code = (extensions as Record<string, unknown>).code;
      if (typeof code === "string") {
        const normalizedCode = code.toUpperCase();
        if (normalizedCode === "UNAUTHENTICATED" || normalizedCode === "FORBIDDEN") {
          return true;
        }
      }
    }

    if (typeof candidate.message === "string") {
      const normalizedMessage = candidate.message.toLowerCase();
      const authKeywords = ["unauth", "not authenticated", "not authorized", "access denied"];
      return authKeywords.some((keyword) => normalizedMessage.includes(keyword));
    }

    return false;
  });
}

const readSavedComparisonSetId = (savedComparisonSet: unknown) => {
  if (
    savedComparisonSet &&
    typeof savedComparisonSet === "object" &&
    !Array.isArray(savedComparisonSet) &&
    "id" in savedComparisonSet &&
    typeof savedComparisonSet.id === "string"
  ) {
    return savedComparisonSet.id;
  }

  return null;
};

function normalizeMutationErrors(
  payloadErrors: unknown,
  response: GraphQLResponse
): CompareMutationError[] {
  if (Array.isArray(payloadErrors)) {
    const typedErrors = payloadErrors.filter(isCompareMutationError);

    if (typedErrors.length > 0) {
      return typedErrors;
    }
  }

  if (!Array.isArray(response) && "errors" in response && Array.isArray(response.errors)) {
    return response.errors.map(() => ({
      code: "GRAPHQL_ERROR",
      field: null,
      message: "Request failed. Please try again."
    }));
  }

  return [];
}

function ensureFailureErrors(errors: CompareMutationError[]) {
  if (errors.length > 0) {
    return errors;
  }

  return [
    {
      code: "UNKNOWN_ERROR",
      field: null,
      message: "Request failed. Please try again."
    }
  ];
}

function isCompareMutationError(value: unknown): value is CompareMutationError {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as {
    code?: unknown;
    field?: unknown;
    message?: unknown;
  };

  return Boolean(
    typeof candidate.code === "string" &&
      typeof candidate.message === "string" &&
      (candidate.field === undefined ||
        candidate.field === null ||
        typeof candidate.field === "string")
  );
}
