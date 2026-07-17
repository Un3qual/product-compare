import { describe, expect, test } from "vitest";
import type { AuthActionResult } from "../../../src/routes/auth/errors";
import {
  buildVerifyEmailRequestData,
  buildVerifyEmailVariables,
  verifyEmailResultIsCacheable,
  VERIFY_EMAIL_MISSING_TOKEN_ERROR,
  VERIFY_EMAIL_SUCCESS_MESSAGE,
  verifyEmailStatusCopy
} from "../../../src/routes/auth/verify-email-data";

describe("verify email data", () => {
  test("normalizes a trimmed token into initial request state", () => {
    expect(buildVerifyEmailRequestData("  confirmation-token  ")).toEqual({
      initialErrors: [],
      isLoading: true,
      token: "confirmation-token"
    });
  });

  test.each([undefined, null, "", "  \t\n  "])(
    "uses one exact missing-token error identity for %s",
    (rawToken) => {
      const requestData = buildVerifyEmailRequestData(rawToken);

      expect(requestData).toEqual({
        initialErrors: [
          {
            code: "INVALID_TOKEN",
            field: "token",
            message: "This verification link is missing or invalid."
          }
        ],
        isLoading: false,
        token: ""
      });
      expect(requestData.initialErrors[0]).toBe(VERIFY_EMAIL_MISSING_TOKEN_ERROR);
    }
  );

  test("builds normalized mutation variables", () => {
    expect(buildVerifyEmailVariables("  confirmation-token  ")).toEqual({
      token: "confirmation-token"
    });
  });

  test("owns exact success, loading, and ready copy", () => {
    expect(VERIFY_EMAIL_SUCCESS_MESSAGE).toBe("Your email address is verified.");
    expect(verifyEmailStatusCopy(true)).toBe("Checking your verification link…");
    expect(verifyEmailStatusCopy(false)).toBe("Verification status is ready.");
  });

  test("caches only successful outcomes without mutating frozen inputs", () => {
    const failureError = Object.freeze({
      code: "INVALID_TOKEN",
      field: "token",
      message: "Expired token"
    });
    const failedResult = Object.freeze({
      ok: false,
      errors: Object.freeze([failureError])
    }) as unknown as AuthActionResult;
    const successfulResult = Object.freeze({
      ok: true,
      errors: Object.freeze([])
    }) as unknown as AuthActionResult;
    const inconsistentResult = Object.freeze({
      ok: true,
      errors: Object.freeze([failureError])
    }) as unknown as AuthActionResult;

    expect(verifyEmailResultIsCacheable(failedResult)).toBe(false);
    expect(verifyEmailResultIsCacheable(successfulResult)).toBe(true);
    expect(verifyEmailResultIsCacheable(inconsistentResult)).toBe(false);
    expect(failedResult.errors).toEqual([failureError]);
    expect(successfulResult.errors).toEqual([]);
  });
});
