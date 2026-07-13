import {
  DEFAULT_ROUTE_ERROR_MESSAGE,
  hasRouteGraphQLErrors,
  isRouteRecord,
  isRouteMutationError,
  type RouteMutationError
} from "../route-errors";
import type { RootViewer } from "../root/loader";

export type MutationError = RouteMutationError;

export interface AuthSessionResult {
  viewer: RootViewer | null;
  errors: MutationError[];
}

export interface AuthActionResult {
  ok: boolean;
  errors: MutationError[];
}

export function findMutationError(errors: MutationError[], field: string) {
  return errors.find((error) => error.field === field)?.message ?? null;
}

export function sanitizeTransportError(_error: unknown) {
  return DEFAULT_ROUTE_ERROR_MESSAGE;
}

export function transportMutationError(error: unknown): MutationError {
  return {
    code: "NETWORK_ERROR",
    field: null,
    message: sanitizeTransportError(error)
  };
}

export function transportMutationErrors(error: unknown): MutationError[] {
  return [transportMutationError(error)];
}

export function invalidTokenMutationError(message: string): MutationError {
  return {
    code: "INVALID_TOKEN",
    field: "token",
    message
  };
}

function relayGraphQLError(errors: readonly unknown[] | null | undefined) {
  if (hasRouteGraphQLErrors(errors)) {
    return transportMutationError(errors);
  }

  return null;
}

export function resolveSessionMutationResult(
  payload: unknown,
  graphQLErrors: readonly unknown[] | null | undefined
): AuthSessionResult {
  const graphQLError = relayGraphQLError(graphQLErrors);

  if (graphQLError) {
    return { viewer: null, errors: [graphQLError] };
  }

  return normalizeSessionPayload(payload);
}

export function resolveActionMutationResult(
  payload: unknown,
  graphQLErrors: readonly unknown[] | null | undefined
): AuthActionResult {
  const graphQLError = relayGraphQLError(graphQLErrors);

  if (graphQLError) {
    return { ok: false, errors: [graphQLError] };
  }

  return normalizeActionPayload(payload);
}

export function isSuccessfulActionResult(result: AuthActionResult) {
  return result.ok && result.errors.length === 0;
}

export function normalizeSessionPayload(payload: unknown): AuthSessionResult {
  const sessionPayload = isRouteRecord(payload) ? payload : {};
  const viewer = isViewer(sessionPayload.viewer) ? sessionPayload.viewer : null;
  const errors = normalizeErrors(sessionPayload.errors);

  return {
    viewer,
    errors: viewer ? errors : ensureFailureErrors(errors)
  };
}

export function normalizeActionPayload(payload: unknown): AuthActionResult {
  const actionPayload = isRouteRecord(payload) ? payload : {};
  const ok = actionPayload.ok === true;
  const errors = normalizeErrors(actionPayload.errors);

  return {
    ok,
    errors: ok ? errors : ensureFailureErrors(errors)
  };
}

function normalizeErrors(payloadErrors: unknown): MutationError[] {
  if (Array.isArray(payloadErrors)) {
    const typedErrors = payloadErrors.filter(isRouteMutationError);

    if (typedErrors.length > 0) {
      return typedErrors;
    }
  }

  return [];
}

function ensureFailureErrors(errors: MutationError[]) {
  if (errors.length > 0) {
    return errors;
  }

  return [
    {
      code: "UNKNOWN_ERROR",
      field: null,
      message: DEFAULT_ROUTE_ERROR_MESSAGE
    }
  ];
}

function isViewer(value: unknown): value is RootViewer {
  return Boolean(
    isRouteRecord(value) &&
      typeof value.id === "string" &&
      typeof value.email === "string" &&
      typeof value.isOperator === "boolean"
  );
}
