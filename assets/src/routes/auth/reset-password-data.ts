import { invalidTokenMutationError, type MutationError } from "./errors";

export const RESET_PASSWORD_MISSING_TOKEN_ERROR: MutationError = Object.freeze(
  invalidTokenMutationError("This reset link is missing or invalid."),
);

export const CREDENTIAL_RESET_COMPLETION_MESSAGE = "Your password has been updated.";

export function normalizeResetPasswordToken(token?: string | null) {
  return token?.trim() ?? "";
}

export function resetPasswordErrorsForToken(token: string): MutationError[] {
  return token ? [] : [RESET_PASSWORD_MISSING_TOKEN_ERROR];
}
