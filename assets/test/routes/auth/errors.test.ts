import { DEFAULT_ROUTE_ERROR_MESSAGE } from "../../../src/routes/route-errors";
import {
  invalidTokenMutationError,
  isSuccessfulActionResult,
  resolveActionMutationResult,
  resolveSessionMutationResult,
  sanitizeTransportError,
  transportMutationError,
  transportMutationErrors
} from "../../../src/routes/auth/errors";

test("auth transport errors use the shared route fallback message", () => {
  expect(sanitizeTransportError(new Error("network unavailable"))).toBe(
    DEFAULT_ROUTE_ERROR_MESSAGE
  );
  expect(transportMutationError(new Error("network unavailable"))).toMatchObject({
    code: "NETWORK_ERROR",
    field: null,
    message: DEFAULT_ROUTE_ERROR_MESSAGE
  });
  expect(transportMutationErrors(new Error("network unavailable"))).toEqual([
    {
      code: "NETWORK_ERROR",
      field: null,
      message: DEFAULT_ROUTE_ERROR_MESSAGE
    }
  ]);
});

test("session mutation results treat top-level Relay errors as session failures", () => {
  const result = resolveSessionMutationResult(
    {
      viewer: {
        id: "viewer-1",
        email: "user@example.com"
      },
      errors: []
    },
    [new Error("top-level GraphQL failure")]
  );

  expect(result.viewer).toBeNull();
  expect(result.errors).toEqual([
    {
      code: "NETWORK_ERROR",
      field: null,
      message: DEFAULT_ROUTE_ERROR_MESSAGE
    }
  ]);
});

test("action mutation results preserve successful payloads without top-level Relay errors", () => {
  expect(resolveActionMutationResult({ ok: true, errors: [] }, [])).toEqual({
    ok: true,
    errors: []
  });
});

test("auth action success requires ok with no typed errors", () => {
  expect(isSuccessfulActionResult({ ok: true, errors: [] })).toBe(true);
  expect(
    isSuccessfulActionResult({
      ok: true,
      errors: [{ code: "INVALID_ARGUMENT", field: null, message: "try again" }]
    })
  ).toBe(false);
  expect(isSuccessfulActionResult({ ok: false, errors: [] })).toBe(false);
});

test("invalid token mutation errors use the shared token field shape", () => {
  expect(invalidTokenMutationError("This link is missing or invalid.")).toEqual({
    code: "INVALID_TOKEN",
    field: "token",
    message: "This link is missing or invalid."
  });
});
