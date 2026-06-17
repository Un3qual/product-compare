import {
  DEFAULT_ROUTE_ERROR_MESSAGE,
  hasRouteGraphQLErrors,
  isRouteRecord,
  isRouteMutationError,
  routeMutationErrorMessage
} from "../../src/routes/route-errors";

test("hasRouteGraphQLErrors detects non-empty top-level GraphQL error arrays", () => {
  const missingErrors = undefined;

  expect(hasRouteGraphQLErrors([{ message: "GraphQL failure" }])).toBe(true);
  expect(hasRouteGraphQLErrors([])).toBe(false);
  expect(hasRouteGraphQLErrors(null)).toBe(false);
  expect(hasRouteGraphQLErrors(missingErrors)).toBe(false);
});

test("isRouteMutationError validates typed GraphQL mutation error entries", () => {
  expect(
    isRouteMutationError({ code: "INVALID_ARGUMENT", message: "Name is required", field: null })
  ).toBe(true);
  expect(
    isRouteMutationError({
      code: "INVALID_ARGUMENT",
      message: "Name is required",
      field: "name"
    })
  ).toBe(true);

  expect(isRouteMutationError({ message: "missing code" })).toBe(false);
  expect(isRouteMutationError({ code: "INVALID_ARGUMENT", message: "invalid field", field: 1 })).toBe(
    false
  );
  expect(isRouteMutationError(Object.assign([], { code: "INVALID_ARGUMENT", message: "array" }))).toBe(
    false
  );
});

test("isRouteRecord accepts object-shaped route payloads", () => {
  expect(isRouteRecord({ id: "payload-1" })).toBe(true);
});

test("isRouteRecord rejects non-record route payloads", () => {
  const missingPayload = undefined;

  expect(isRouteRecord(null)).toBe(false);
  expect(isRouteRecord(missingPayload)).toBe(false);
  expect(isRouteRecord("payload")).toBe(false);
  expect(isRouteRecord(42)).toBe(false);
  expect(isRouteRecord(["payload"])).toBe(false);
  expect(isRouteRecord(() => "payload")).toBe(false);
});

test("routeMutationErrorMessage returns the first typed mutation error message", () => {
  expect(
    routeMutationErrorMessage([
      { code: "INVALID_ARGUMENT", message: "Name is required", field: "name" },
      { code: "INVALID_ARGUMENT", message: "Product is required", field: "productIds" }
    ])
  ).toBe("Name is required");
});

test("routeMutationErrorMessage falls back when errors are missing or malformed", () => {
  const missingErrors = undefined;

  expect(routeMutationErrorMessage(missingErrors)).toBe(DEFAULT_ROUTE_ERROR_MESSAGE);
  expect(routeMutationErrorMessage([])).toBe(DEFAULT_ROUTE_ERROR_MESSAGE);
  expect(routeMutationErrorMessage([{ code: "INVALID_ARGUMENT" }])).toBe(
    DEFAULT_ROUTE_ERROR_MESSAGE
  );
  expect(routeMutationErrorMessage([{ message: "Message without code" }])).toBe(
    DEFAULT_ROUTE_ERROR_MESSAGE
  );
  expect(
    routeMutationErrorMessage([
      { code: "INVALID_ARGUMENT", message: "Invalid field", field: 123 }
    ])
  ).toBe(DEFAULT_ROUTE_ERROR_MESSAGE);
  expect(routeMutationErrorMessage(["Name is required"])).toBe(DEFAULT_ROUTE_ERROR_MESSAGE);

  const arrayShapedError = Object.assign([], { message: "Array payload message" });
  expect(routeMutationErrorMessage([arrayShapedError])).toBe(DEFAULT_ROUTE_ERROR_MESSAGE);
});

test("routeMutationErrorMessage hides payload details when Relay reports top-level GraphQL errors", () => {
  expect(
    routeMutationErrorMessage(
      [{ code: "INVALID_ARGUMENT", message: "Name is required", field: "name" }],
      [{ message: "database stacktrace" }]
    )
  ).toBe(DEFAULT_ROUTE_ERROR_MESSAGE);
});
