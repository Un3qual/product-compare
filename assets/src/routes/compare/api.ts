import type { GraphQLResponse } from "relay-runtime";
import type { LoaderFunctionArgs } from "react-router-dom";
import { fetchGraphQL } from "../../relay/fetch-graphql";
import type { ProductDetail } from "../products/api";
import { loadProductDetail } from "../products/api";

export interface CompareMutationError {
  code: string;
  field?: string | null;
  message: string;
}

export interface CreateSavedComparisonSetInput {
  name: string;
  productIds: string[];
}

export interface CreateSavedComparisonSetResult {
  savedComparisonSetId: string | null;
  errors: CompareMutationError[];
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

export type CompareRouteLoaderData =
  | {
      status: "empty";
      slugs: [];
    }
  | {
      status: "too_many" | "not_found";
      slugs: string[];
    }
  | {
      status: "ready";
      slugs: string[];
      products: ProductDetail[];
    };

export interface SavedComparisonsRouteLoaderData {
  status: "ready" | "empty" | "unauthorized";
  savedSets: SavedComparisonSetSummary[];
  truncated?: boolean;
}

const CREATE_SAVED_COMPARISON_SET_MUTATION = `
  mutation CreateSavedComparisonSet($input: CreateSavedComparisonSetInput!) {
    createSavedComparisonSet(input: $input) {
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

const MY_SAVED_COMPARISON_SETS_QUERY = `
  query MySavedComparisonSets($first: Int, $after: String) {
    mySavedComparisonSets(first: $first, after: $after) {
      edges {
        node {
          id
          name
          items {
            position
            product {
              slug
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

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

export async function compareLoader({
  request
}: LoaderFunctionArgs): Promise<CompareRouteLoaderData> {
  const slugs = parseSelectedSlugs(request.url);

  if (slugs.length === 0) {
    return {
      status: "empty",
      slugs: []
    };
  }

  if (slugs.length > 3) {
    return {
      status: "too_many",
      slugs
    };
  }

  const ssrContext = typeof window === "undefined" ? { request } : undefined;
  const productResults = await Promise.allSettled(
    slugs.map((slug) => loadProductDetail(slug, ssrContext))
  );

  const rejectedResult = productResults.find((result) => result.status === "rejected");

  if (rejectedResult && rejectedResult.status === "rejected") {
    throw rejectedResult.reason instanceof Error
      ? rejectedResult.reason
      : new Error("Product fetch failed");
  }

  const fulfilledResults = productResults.filter(
    (result): result is PromiseFulfilledResult<ProductDetail | null> =>
      result.status === "fulfilled"
  );

  if (fulfilledResults.some((result) => result.value === null)) {
    return {
      status: "not_found",
      slugs
    };
  }

  return {
    status: "ready",
    slugs,
    products: fulfilledResults.flatMap((result) =>
      result.value === null ? [] : [result.value]
    )
  };
}

export async function createSavedComparisonSet(
  input: CreateSavedComparisonSetInput
): Promise<CreateSavedComparisonSetResult> {
  const response = await fetchGraphQL(CREATE_SAVED_COMPARISON_SET_MUTATION, { input });
  const payload = readMutationPayload(response, "createSavedComparisonSet");
  const savedComparisonSetId = readSavedComparisonSetId(payload.savedComparisonSet);
  const errors = normalizeMutationErrors(payload.errors, response);

  return {
    savedComparisonSetId,
    errors: savedComparisonSetId ? errors : ensureFailureErrors(errors)
  };
}

export async function savedComparisonsLoader({
  request
}: LoaderFunctionArgs): Promise<SavedComparisonsRouteLoaderData> {
  const ssrContext = typeof window === "undefined" ? { request } : undefined;
  const savedSets: SavedComparisonSetSummary[] = [];
  let after: string | undefined;
  let pageCount = 0;

  let truncated = false;

  while (true) {
    if (pageCount >= SAVED_COMPARISON_SETS_MAX_PAGES) {
      truncated = true;
      break;
    }

    pageCount += 1;
    const response = await fetchGraphQL(
      MY_SAVED_COMPARISON_SETS_QUERY,
      after === undefined
        ? { first: SAVED_COMPARISON_SETS_PAGE_SIZE }
        : { first: SAVED_COMPARISON_SETS_PAGE_SIZE, after },
      ssrContext
    );

    if (isUnauthorizedSavedComparisonsResponse(response)) {
      return {
        status: "unauthorized",
        savedSets: []
      };
    }

    const page = parseSavedComparisonSetsPage(response);

    if (page === null) {
      throw new Error("Failed to parse saved comparison sets response");
    }

    savedSets.push(...page.savedSets);

    if (!page.hasNextPage) {
      break;
    }

    if (!page.endCursor || page.endCursor === after) {
      throw new Error("Invalid pagination cursor");
    }

    after = page.endCursor;
  }

  return {
    status: savedSets.length === 0 ? "empty" : "ready",
    savedSets,
    ...(truncated ? { truncated: true } : {})
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

function parseSelectedSlugs(requestUrl: string) {
  const url = new URL(requestUrl);
  const selected = new Set<string>();

  for (const rawSlug of url.searchParams.getAll("slug")) {
    const slug = rawSlug.trim();

    if (slug !== "") {
      selected.add(slug);
    }
  }

  return Array.from(selected);
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

function parseConnection<T>(
  response: GraphQLResponse,
  connectionKey: string,
  edgeParser: (edge: unknown) => T | null
): {
  items: T[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
} | null {
  if (!response || typeof response !== "object" || Array.isArray(response)) {
    return null;
  }

  if (!("data" in response) || !response.data) {
    return null;
  }

  if (typeof response.data !== "object" || Array.isArray(response.data)) {
    return null;
  }

  const connection = (response.data as Record<string, unknown>)[connectionKey];

  if (!connection || typeof connection !== "object" || Array.isArray(connection)) {
    return null;
  }

  const edges = (connection as Record<string, unknown>).edges;

  if (!Array.isArray(edges)) {
    return null;
  }

  const items: T[] = [];

  for (const edge of edges) {
    const item = edgeParser(edge);

    if (!item) {
      return null;
    }

    items.push(item);
  }

  const pageInfo = (connection as Record<string, unknown>).pageInfo;

  if (!pageInfo || typeof pageInfo !== "object" || Array.isArray(pageInfo)) {
    return null;
  }

  const candidatePageInfo = pageInfo as Record<string, unknown>;

  if (typeof candidatePageInfo.hasNextPage !== "boolean") {
    return null;
  }

  if (
    candidatePageInfo.endCursor !== null &&
    typeof candidatePageInfo.endCursor !== "string"
  ) {
    return null;
  }

  return {
    items,
    pageInfo: {
      hasNextPage: candidatePageInfo.hasNextPage,
      endCursor: candidatePageInfo.endCursor
    }
  };
}

function parseSavedComparisonSetsPage(
  response: GraphQLResponse
): {
  savedSets: SavedComparisonSetSummary[];
  hasNextPage: boolean;
  endCursor: string | null;
} | null {
  const result = parseConnection(
    response,
    "mySavedComparisonSets",
    parseSavedComparisonSetEdge
  );

  if (!result) {
    return null;
  }

  return {
    savedSets: result.items,
    hasNextPage: result.pageInfo.hasNextPage,
    endCursor: result.pageInfo.endCursor
  };
}

function parseSavedComparisonSetEdge(edge: unknown): SavedComparisonSetSummary | null {
  if (!edge || typeof edge !== "object" || Array.isArray(edge)) {
    return null;
  }

  const node = (edge as Record<string, unknown>).node;

  if (!node || typeof node !== "object" || Array.isArray(node)) {
    return null;
  }

  const candidate = node as Record<string, unknown>;

  if (typeof candidate.id !== "string" || typeof candidate.name !== "string") {
    return null;
  }

  const slugs = parseSavedComparisonItems(candidate.items);

  if (slugs === null) {
    return null;
  }

  return {
    id: candidate.id,
    name: candidate.name,
    slugs
  };
}

function parseSavedComparisonItems(items: unknown): string[] | null {
  if (!Array.isArray(items)) {
    return null;
  }

  const parsedItems = items.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return null;
    }

    const candidate = item as Record<string, unknown>;
    const product = candidate.product;

    if (
      typeof candidate.position !== "number" ||
      !product ||
      typeof product !== "object" ||
      Array.isArray(product)
    ) {
      return null;
    }

    return {
      position: candidate.position,
      slug: typeof (product as Record<string, unknown>).slug === "string"
        ? ((product as Record<string, unknown>).slug as string)
        : null
    };
  });

  if (parsedItems.some((item) => item === null || item.slug === null)) {
    return null;
  }

  const validItems = parsedItems as Array<{
    position: number;
    slug: string;
  }>;

  return validItems
    .sort((left, right) => left.position - right.position)
    .map((item) => item.slug);
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

    // Check if the error path includes "mySavedComparisonSets"
    const isRelevantPath =
      Array.isArray(candidate.path) &&
      candidate.path.some((segment) => segment === "mySavedComparisonSets");

    if (!isRelevantPath) {
      return false;
    }

    // Check GraphQL extensions code
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

    // Fall back to checking message for common auth-related keywords
    if (typeof candidate.message === "string") {
      const normalizedMessage = candidate.message.toLowerCase();
      const authKeywords = ["unauth", "not authenticated", "access denied"];
      return authKeywords.some((keyword) => normalizedMessage.includes(keyword));
    }

    return false;
  });
}

function readSavedComparisonSetId(savedComparisonSet: unknown) {
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
}

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