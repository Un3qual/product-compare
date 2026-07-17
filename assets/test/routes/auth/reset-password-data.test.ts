import {
  CREDENTIAL_RESET_COMPLETION_MESSAGE,
  RESET_PASSWORD_MISSING_TOKEN_ERROR,
  normalizeResetPasswordToken,
  resetPasswordErrorsForToken
} from "../../../src/routes/auth/reset-password-data";

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

test("owns the exact reset-password success copy", () => {
  expect(CREDENTIAL_RESET_COMPLETION_MESSAGE).toBe(
    "Your password has been updated."
  );
});
