import {
  DEFAULT_MUTATION_ERROR_MESSAGE,
  hasGraphQLErrors,
  type MutationGraphQLErrors,
} from "$relay/mutation-errors";
import type { ForgotPasswordRouteMutation } from "$generated/ForgotPasswordRouteMutation.graphql";
import type { LoginRouteMutation } from "$generated/LoginRouteMutation.graphql";

type SessionPayload = LoginRouteMutation["response"]["login"];
type ActionPayload = ForgotPasswordRouteMutation["response"]["forgotPassword"];

export type MutationError = SessionPayload["errors"][number];

export interface AuthSessionResult {
  viewer: SessionPayload["viewer"];
  errors: MutationError[];
}

export interface AuthActionResult {
  ok: boolean;
  errors: MutationError[];
}

export function findMutationError(errors: MutationError[], field: string) {
  return errors.find((error) => error.field === field)?.message ?? null;
}

export function selectGlobalMutationErrors(
  errors: readonly MutationError[],
  fieldNames: readonly string[],
): MutationError[] {
  const renderedFields = new Set(fieldNames);

  return errors.filter((error) => {
    const field = error.field;

    return field === null || field === "" || !renderedFields.has(field);
  });
}

export function sanitizeTransportError(_error: unknown) {
  return DEFAULT_MUTATION_ERROR_MESSAGE;
}

export function transportMutationError(error: unknown): MutationError {
  return {
    code: "NETWORK_ERROR",
    field: null,
    message: sanitizeTransportError(error),
  };
}

export function transportMutationErrors(error: unknown): MutationError[] {
  return [transportMutationError(error)];
}

export function invalidTokenMutationError(message: string): MutationError {
  return {
    code: "INVALID_TOKEN",
    field: "token",
    message,
  };
}

function relayGraphQLError(errors: MutationGraphQLErrors) {
  if (hasGraphQLErrors(errors)) {
    return transportMutationError(errors);
  }

  return null;
}

export function resolveSessionMutationResult(
  payload: SessionPayload,
  graphQLErrors: MutationGraphQLErrors,
): AuthSessionResult {
  const graphQLError = relayGraphQLError(graphQLErrors);

  if (graphQLError) {
    return { viewer: null, errors: [graphQLError] };
  }

  const viewer = payload.viewer ?? null;
  const errors = [...payload.errors];

  return {
    viewer,
    errors: viewer ? errors : ensureFailureErrors(errors),
  };
}

export function resolveActionMutationResult(
  payload: ActionPayload,
  graphQLErrors: MutationGraphQLErrors,
): AuthActionResult {
  const graphQLError = relayGraphQLError(graphQLErrors);

  if (graphQLError) {
    return { ok: false, errors: [graphQLError] };
  }

  const ok = payload.ok;
  const errors = [...payload.errors];

  return {
    ok,
    errors: ok ? errors : ensureFailureErrors(errors),
  };
}

export function isSuccessfulActionResult(result: AuthActionResult) {
  return result.ok && result.errors.length === 0;
}

function ensureFailureErrors(errors: MutationError[]) {
  if (errors.length > 0) {
    return errors;
  }

  return [
    {
      code: "UNKNOWN_ERROR",
      field: null,
      message: DEFAULT_MUTATION_ERROR_MESSAGE,
    },
  ];
}
