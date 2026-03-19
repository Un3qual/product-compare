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

export type CompareRouteLoaderData =
  | {
      status: "empty";
      slugs: [];
    }
  | {
      status: "too_many" | "not_found" | "error";
      slugs: string[];
    }
  | {
      status: "ready";
      slugs: string[];
      products: ProductDetail[];
    };

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

  if (productResults.some((result) => result.status === "rejected")) {
    return {
      status: "error",
      slugs
    };
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
  const payload = readCreateSavedComparisonSetPayload(response);
  const savedComparisonSetId = readSavedComparisonSetId(payload.savedComparisonSet);
  const errors = normalizeMutationErrors(payload.errors, response);

  return {
    savedComparisonSetId,
    errors: savedComparisonSetId ? errors : ensureFailureErrors(errors)
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

function readCreateSavedComparisonSetPayload(response: GraphQLResponse) {
  if (
    !Array.isArray(response) &&
    "data" in response &&
    response.data &&
    typeof response.data === "object" &&
    !Array.isArray(response.data)
  ) {
    const payload = (response.data as Record<string, unknown>).createSavedComparisonSet;

    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
      return payload as Record<string, unknown>;
    }
  }

  return {};
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
