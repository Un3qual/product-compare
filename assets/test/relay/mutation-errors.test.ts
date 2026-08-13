import {
  DEFAULT_MUTATION_ERROR_MESSAGE,
  hasGraphQLErrors,
  mutationErrorMessage,
} from "../../src/relay/mutation-errors";

test("hasGraphQLErrors detects top-level Relay errors", () => {
  expect(hasGraphQLErrors([{ message: "GraphQL failure" }])).toBe(true);
  expect(hasGraphQLErrors([])).toBe(false);
  expect(hasGraphQLErrors(null)).toBe(false);
});

test("mutationErrorMessage returns the first generated payload error", () => {
  expect(
    mutationErrorMessage([{ code: "INVALID_ARGUMENT", field: null, message: "Name is required" }]),
  ).toBe("Name is required");
});

test("mutationErrorMessage uses the safe fallback for missing or transport errors", () => {
  expect(mutationErrorMessage([])).toBe(DEFAULT_MUTATION_ERROR_MESSAGE);
  expect(
    mutationErrorMessage(
      [{ code: "INVALID_ARGUMENT", field: null, message: "Payload detail" }],
      [{ message: "GraphQL failure" }],
    ),
  ).toBe(DEFAULT_MUTATION_ERROR_MESSAGE);
});
