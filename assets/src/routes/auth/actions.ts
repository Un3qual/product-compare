import type { GraphQLResponse } from "relay-runtime";
import { fetchGraphQL } from "../../relay/fetch-graphql";

export interface MutationError {
  code: string;
  field?: string | null;
  message: string;
}

interface Viewer {
  id: string;
  email: string;
}

export interface AuthSessionResult {
  viewer: Viewer | null;
  errors: MutationError[];
}

export interface AuthActionResult {
  ok: boolean;
  errors: MutationError[];
}

const transportErrorMessage = "Request failed. Please try again.";

export function findMutationError(errors: MutationError[], field: string) {
  return errors.find((error) => error.field === field)?.message ?? null;
}

export function sanitizeTransportError(_error: unknown) {
  return transportErrorMessage;
}

const LOGIN_MUTATION = `
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      viewer {
        id
        email
      }
      errors {
        code
        field
        message
      }
    }
  }
`;

const REGISTER_MUTATION = `
  mutation Register($email: String!, $password: String!) {
    register(email: $email, password: $password) {
      viewer {
        id
        email
      }
      errors {
        code
        field
        message
      }
    }
  }
`;

const FORGOT_PASSWORD_MUTATION = `
  mutation ForgotPassword($email: String!) {
    forgotPassword(email: $email) {
      ok
      errors {
        code
        field
        message
      }
    }
  }
`;

const RESET_PASSWORD_MUTATION = `
  mutation ResetPassword($token: String!, $password: String!) {
    resetPassword(token: $token, password: $password) {
      ok
      errors {
        code
        field
        message
      }
    }
  }
`;

const VERIFY_EMAIL_MUTATION = `
  mutation VerifyEmail($token: String!) {
    verifyEmail(token: $token) {
      ok
      errors {
        code
        field
        message
      }
    }
  }
`;

export async function loginWithPassword(email: string, password: string) {
  const response = await fetchGraphQL(LOGIN_MUTATION, { email, password });
  return parseSessionPayload(response, "login");
}

export async function registerWithPassword(email: string, password: string) {
  const response = await fetchGraphQL(REGISTER_MUTATION, { email, password });
  return parseSessionPayload(response, "register");
}

export async function requestPasswordReset(email: string) {
  const response = await fetchGraphQL(FORGOT_PASSWORD_MUTATION, { email });
  return parseActionPayload(response, "forgotPassword");
}

export async function resetPassword(token: string, password: string) {
  const response = await fetchGraphQL(RESET_PASSWORD_MUTATION, { token, password });
  return parseActionPayload(response, "resetPassword");
}

export async function verifyEmail(token: string) {
  const response = await fetchGraphQL(VERIFY_EMAIL_MUTATION, { token });
  return parseActionPayload(response, "verifyEmail");
}

function parseSessionPayload(response: GraphQLResponse, fieldName: string): AuthSessionResult {
  const payload = readPayload(response, fieldName);

  return {
    viewer: isViewer(payload.viewer) ? payload.viewer : null,
    errors: normalizeErrors(payload.errors, response)
  };
}

function parseActionPayload(response: GraphQLResponse, fieldName: string): AuthActionResult {
  const payload = readPayload(response, fieldName);

  return {
    ok: payload.ok === true,
    errors: normalizeErrors(payload.errors, response)
  };
}

function readPayload(response: GraphQLResponse, fieldName: string) {
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

function normalizeErrors(
  payloadErrors: unknown,
  response: GraphQLResponse
): MutationError[] {
  if (Array.isArray(payloadErrors)) {
    const typedErrors = payloadErrors.filter(isMutationError);

    if (typedErrors.length > 0) {
      return typedErrors;
    }
  }

  if (!Array.isArray(response) && "errors" in response && Array.isArray(response.errors)) {
    return response.errors.map((error: { message: string }) => ({
      code: "GRAPHQL_ERROR",
      field: null,
      message: error.message
    }));
  }

  return [];
}

function isMutationError(value: unknown): value is MutationError {
  return Boolean(
    value &&
      typeof value === "object" &&
      "code" in value &&
      "message" in value &&
      typeof value.code === "string" &&
      typeof value.message === "string"
  );
}

function isViewer(value: unknown): value is Viewer {
  return Boolean(
    value &&
      typeof value === "object" &&
      "id" in value &&
      "email" in value &&
      typeof value.id === "string" &&
      typeof value.email === "string"
  );
}
