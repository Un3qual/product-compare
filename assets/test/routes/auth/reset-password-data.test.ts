import {
  RESET_PASSWORD_MISSING_TOKEN_ERROR,
  RESET_PASSWORD_SUCCESS_MESSAGE,
  buildResetPasswordVariables,
  isCurrentResetPasswordRequest,
  normalizeResetPasswordToken,
  resetPasswordErrorsForToken
} from "../../../src/routes/auth/reset-password-data";

test("normalizes trimmed, blank, and missing reset tokens", () => {
  expect(normalizeResetPasswordToken("  reset-token  ")).toBe("reset-token");
  expect(normalizeResetPasswordToken("   ")).toBe("");
  expect(normalizeResetPasswordToken(null)).toBe("");
  expect(normalizeResetPasswordToken(undefined)).toBe("");
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
    password: "new-password",
    token: "reset-token"
  });

  expect(buildResetPasswordVariables(input)).toEqual({
    password: "new-password",
    token: "reset-token"
  });
  expect(input).toEqual({
    password: "new-password",
    token: "reset-token"
  });
});

test("owns the exact reset-password success copy", () => {
  expect(RESET_PASSWORD_SUCCESS_MESSAGE).toBe("Your password has been updated.");
});

test("accepts only the active reset-password request version", () => {
  expect(isCurrentResetPasswordRequest(7, 7)).toBe(true);
  expect(isCurrentResetPasswordRequest(6, 7)).toBe(false);
  expect(isCurrentResetPasswordRequest(8, 7)).toBe(false);
});
