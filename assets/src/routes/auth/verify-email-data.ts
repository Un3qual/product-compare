import { invalidTokenMutationError, type MutationError } from "./errors";

export const VERIFY_EMAIL_MISSING_TOKEN_ERROR = invalidTokenMutationError(
  "This verification link is missing or invalid.",
);

export const VERIFY_EMAIL_SUCCESS_MESSAGE = "Your email address is verified.";

export type VerifyEmailRequestData = {
  readonly initialErrors: MutationError[];
  readonly isLoading: boolean;
  readonly token: string;
};

export function buildVerifyEmailRequestData(rawToken: string | null): VerifyEmailRequestData {
  const token = normalizeVerifyEmailToken(rawToken);

  return {
    initialErrors: token ? [] : [VERIFY_EMAIL_MISSING_TOKEN_ERROR],
    isLoading: Boolean(token),
    token,
  };
}

function normalizeVerifyEmailToken(rawToken: string | null) {
  return rawToken?.trim() ?? "";
}
