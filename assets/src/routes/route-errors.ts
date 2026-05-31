export const DEFAULT_ROUTE_ERROR_MESSAGE = "Request failed. Please try again.";

export function hasRouteGraphQLErrors(errors: readonly unknown[] | null | undefined) {
  return Array.isArray(errors) && errors.length > 0;
}

export function routeMutationErrorMessage(
  errors: unknown,
  graphQLErrors?: readonly unknown[] | null
) {
  if (hasRouteGraphQLErrors(graphQLErrors)) {
    return DEFAULT_ROUTE_ERROR_MESSAGE;
  }

  if (!Array.isArray(errors)) {
    return DEFAULT_ROUTE_ERROR_MESSAGE;
  }

  const firstMessage = errors.find(isRouteMutationError)?.message;

  return firstMessage ?? DEFAULT_ROUTE_ERROR_MESSAGE;
}

export interface RouteMutationError {
  code: string;
  field?: string | null;
  message: string;
}

export function isRouteMutationError(error: unknown): error is RouteMutationError {
  return Boolean(
    isRouteRecord(error) &&
      typeof error.code === "string" &&
      typeof error.message === "string" &&
      (error.field === undefined || error.field === null || typeof error.field === "string")
  );
}

export function isRouteRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
