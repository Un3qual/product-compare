import {
  invalidTokenMutationError,
  type MutationError
} from "./errors";

export const RESET_PASSWORD_MISSING_TOKEN_ERROR: MutationError = Object.freeze(
  invalidTokenMutationError("This reset link is missing or invalid.")
);

export const RESET_PASSWORD_SUCCESS_MESSAGE = "Your password has been updated.";

interface ResetPasswordVariablesInput {
  readonly password: string;
  readonly token: string;
}

export function normalizeResetPasswordToken(token: string | null | undefined) {
  return token?.trim() ?? "";
}

export function resetPasswordErrorsForToken(token: string): MutationError[] {
  return token ? [] : [RESET_PASSWORD_MISSING_TOKEN_ERROR];
}

export function buildResetPasswordVariables({
  password,
  token
}: ResetPasswordVariablesInput) {
  return { password, token };
}

export function isCurrentResetPasswordRequest(
  requestVersion: number,
  activeRequestVersion: number
) {
  return requestVersion === activeRequestVersion;
}
