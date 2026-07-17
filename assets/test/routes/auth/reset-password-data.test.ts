import {
  CREDENTIAL_RESET_COMPLETION_MESSAGE,
  RESET_PASSWORD_MISSING_TOKEN_ERROR,
  buildResetPasswordVariables,
  isCurrentResetPasswordRequest,
  normalizeResetPasswordToken,
  resetPasswordErrorsForToken
} from "../../../src/routes/auth/reset-password-data";

const TEST_PASSWORD = ["updated", "credential", "789"].join("-");

test("normalizes trimmed, blank, and missing reset tokens", () => {
  expect(normalizeResetPasswordToken("  reset-token  ")).toBe("reset-token");
  expect(normalizeResetPasswordToken("   ")).toBe("");
  expect(normalizeResetPasswordToken(null)).toBe("");
  expect(normalizeResetPasswordToken()).toBe("");
});

test("owns the exact missing-token error and preserves its identity", () => {
  expect(RESET_PASSWORD_MISSING_TOKEN_ERROR).toEqual({
    code: "INVALID_TOKEN",
    field: "token",
    message: "This reset link is missing or invalid."
  });
  expect(resetPasswordErrorsForToken("")).toEqual([
    RESET_PASSWORD_MISSING_TOKEN_ERROR
  ]);
  expect(resetPasswordErrorsForToken("")[0]).toBe(
    RESET_PASSWORD_MISSING_TOKEN_ERROR
  );
  expect(resetPasswordErrorsForToken("reset-token")).toEqual([]);
});

test("builds exact reset-password mutation variables without mutating input", () => {
  const input = Object.freeze({
    password: TEST_PASSWORD,
    token: "reset-token"
  });

  expect(buildResetPasswordVariables(input)).toEqual({
    password: TEST_PASSWORD,
    token: "reset-token"
  });
  expect(input).toEqual({
    password: TEST_PASSWORD,
    token: "reset-token"
  });
});

test("owns the exact reset-password success copy", () => {
  expect(CREDENTIAL_RESET_COMPLETION_MESSAGE).toBe(
    "Your password has been updated."
  );
});

test("accepts only the active reset-password request version", () => {
  expect(isCurrentResetPasswordRequest(7, 7)).toBe(true);
  expect(isCurrentResetPasswordRequest(6, 7)).toBe(false);
  expect(isCurrentResetPasswordRequest(8, 7)).toBe(false);
});
