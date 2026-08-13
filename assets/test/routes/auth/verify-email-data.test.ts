import { describe, expect, test } from "vitest";
import {
  buildVerifyEmailRequestData,
  VERIFY_EMAIL_MISSING_TOKEN_ERROR,
  VERIFY_EMAIL_SUCCESS_MESSAGE,
} from "../../../src/routes/auth/verify-email-data";

describe("verify email data", () => {
  test("normalizes a trimmed token into initial request state", () => {
    expect(buildVerifyEmailRequestData("  confirmation-token  ")).toEqual({
      initialErrors: [],
      isLoading: true,
      token: "confirmation-token",
    });
  });

  test.each([null, "", "  \t\n  "])(
    "uses one exact missing-token error identity for %s",
    (rawToken) => {
      const requestData = buildVerifyEmailRequestData(rawToken);

      expect(requestData).toEqual({
        initialErrors: [
          {
            code: "INVALID_TOKEN",
            field: "token",
            message: "This verification link is missing or invalid.",
          },
        ],
        isLoading: false,
        token: "",
      });
      expect(requestData.initialErrors[0]).toBe(VERIFY_EMAIL_MISSING_TOKEN_ERROR);
    },
  );

  test("owns the exact success copy", () => {
    expect(VERIFY_EMAIL_SUCCESS_MESSAGE).toBe("Your email address is verified.");
  });
});
