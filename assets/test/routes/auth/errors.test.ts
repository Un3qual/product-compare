import { DEFAULT_MUTATION_ERROR_MESSAGE } from "../../../src/relay/mutation-errors";
import {
  invalidTokenMutationError,
  isSuccessfulActionResult,
  resolveActionMutationResult,
  resolveSessionMutationResult,
  sanitizeTransportError,
  selectGlobalMutationErrors,
  transportMutationError,
  transportMutationErrors,
} from "../../../src/routes/auth/errors";

test("auth transport errors use the shared route fallback message", () => {
  expect(sanitizeTransportError(new Error("network unavailable"))).toBe(
    DEFAULT_MUTATION_ERROR_MESSAGE,
  );
  expect(transportMutationError(new Error("network unavailable"))).toMatchObject({
    code: "NETWORK_ERROR",
    field: null,
    message: DEFAULT_MUTATION_ERROR_MESSAGE,
  });
  expect(transportMutationErrors(new Error("network unavailable"))).toEqual([
    {
      code: "NETWORK_ERROR",
      field: null,
      message: DEFAULT_MUTATION_ERROR_MESSAGE,
    },
  ]);
});

test("session mutation results treat top-level Relay errors as session failures", () => {
  const result = resolveSessionMutationResult(
    {
      viewer: {
        id: "viewer-1",
        email: "user@example.com",
        isOperator: false,
      },
      errors: [],
    },
    [new Error("top-level GraphQL failure")],
  );

  expect(result.viewer).toBeNull();
  expect(result.errors).toEqual([
    {
      code: "NETWORK_ERROR",
      field: null,
      message: DEFAULT_MUTATION_ERROR_MESSAGE,
    },
  ]);
});

test("session mutation results preserve the generated Relay viewer", () => {
  expect(
    resolveSessionMutationResult(
      {
        viewer: {
          id: "viewer-1",
          email: "user@example.com",
          isOperator: false,
        },
        errors: [],
      },
      [],
    ),
  ).toEqual({
    viewer: { id: "viewer-1", email: "user@example.com", isOperator: false },
    errors: [],
  });
});

test("action mutation results preserve successful payloads without top-level Relay errors", () => {
  expect(resolveActionMutationResult({ ok: true, errors: [] }, [])).toEqual({
    ok: true,
    errors: [],
  });
});

test("auth action success requires ok with no typed errors", () => {
  expect(isSuccessfulActionResult({ ok: true, errors: [] })).toBe(true);
  expect(
    isSuccessfulActionResult({
      ok: true,
      errors: [{ code: "INVALID_ARGUMENT", field: null, message: "try again" }],
    }),
  ).toBe(false);
  expect(isSuccessfulActionResult({ ok: false, errors: [] })).toBe(false);
});

test("invalid token mutation errors use the shared token field shape", () => {
  expect(invalidTokenMutationError("This link is missing or invalid.")).toEqual({
    code: "INVALID_TOKEN",
    field: "token",
    message: "This link is missing or invalid.",
  });
});

test("global mutation errors retain missing, null, blank, and unknown fields", () => {
  const errors = [
    { code: "MISSING", field: undefined, message: "Missing field." },
    { code: "NULL", field: null, message: "Null field." },
    { code: "BLANK", field: "", message: "Blank field." },
    { code: "UNKNOWN", field: "username", message: "Unknown field." },
    { code: "EMAIL", field: "email", message: "Email error." },
  ];

  expect(selectGlobalMutationErrors(errors, ["email", "password"])).toEqual([
    { code: "MISSING", field: undefined, message: "Missing field." },
    { code: "NULL", field: null, message: "Null field." },
    { code: "BLANK", field: "", message: "Blank field." },
    { code: "UNKNOWN", field: "username", message: "Unknown field." },
  ]);
});

test("global mutation errors preserve source order and inputs", () => {
  const errors = [
    { code: "USERNAME", field: "username", message: "Username error." },
    { code: "GLOBAL", field: null, message: "Global error." },
    { code: "EMAIL", field: "email", message: "Email error." },
  ];
  const fieldNames = ["email"];
  const expectedErrors = structuredClone(errors);
  const expectedFieldNames = structuredClone(fieldNames);

  expect(selectGlobalMutationErrors(errors, fieldNames)).toEqual([
    { code: "USERNAME", field: "username", message: "Username error." },
    { code: "GLOBAL", field: null, message: "Global error." },
  ]);
  expect(errors).toEqual(expectedErrors);
  expect(fieldNames).toEqual(expectedFieldNames);
});
