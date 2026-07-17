import {
  type AuthActionResult,
  invalidTokenMutationError,
  isSuccessfulActionResult,
  type MutationError
} from "./errors";

export const VERIFY_EMAIL_MISSING_TOKEN_ERROR = invalidTokenMutationError(
  "This verification link is missing or invalid."
);

export const VERIFY_EMAIL_SUCCESS_MESSAGE = "Your email address is verified.";

export type VerifyEmailRequestData = {
  readonly initialErrors: MutationError[];
  readonly isLoading: boolean;
  readonly token: string;
};

export function buildVerifyEmailRequestData(
  rawToken: string | null | undefined
): VerifyEmailRequestData {
  const token = normalizeVerifyEmailToken(rawToken);

  return {
    initialErrors: token ? [] : [VERIFY_EMAIL_MISSING_TOKEN_ERROR],
    isLoading: Boolean(token),
    token
  };
}

export function buildVerifyEmailVariables(rawToken: string | null | undefined) {
  return { token: normalizeVerifyEmailToken(rawToken) };
}

export function verifyEmailStatusCopy(isLoading: boolean) {
  return isLoading
    ? "Checking your verification link…"
    : "Verification status is ready.";
}

export function verifyEmailResultIsCacheable(result: AuthActionResult) {
  return isSuccessfulActionResult(result);
}

function normalizeVerifyEmailToken(rawToken: string | null | undefined) {
  return rawToken?.trim() ?? "";
}
