import { DEFAULT_ROUTE_ERROR_MESSAGE } from "../../../src/routes/route-errors";
import {
  buildDeleteSavedComparisonSetMutationVariables,
  resolveDeleteSavedComparisonSetMutationOutcome
} from "../../../src/routes/compare/saved-comparison-delete-mutation-data";

const MUTATION_ERROR = {
  code: "BAD_USER_INPUT",
  field: "savedComparisonSetId",
  message: "Could not delete this comparison set."
};

test("buildDeleteSavedComparisonSetMutationVariables returns the exact delete shape without changing its source", () => {
  const savedComparisonSet = { id: "saved-set-1", name: "Desk setup" };

  const variables = buildDeleteSavedComparisonSetMutationVariables(savedComparisonSet);

  expect(variables).toEqual({ savedComparisonSetId: "saved-set-1" });
  expect(variables).not.toBe(savedComparisonSet);
  expect(savedComparisonSet).toEqual({ id: "saved-set-1", name: "Desk setup" });
});

test("resolveDeleteSavedComparisonSetMutationOutcome returns the deleted ID for a complete payload", () => {
  expect(
    resolveDeleteSavedComparisonSetMutationOutcome(
      { savedComparisonSet: { id: "saved-set-1" }, errors: [] },
      []
    )
  ).toEqual({ deletedSavedComparisonSetId: "saved-set-1", error: null });
});

test("resolveDeleteSavedComparisonSetMutationOutcome keeps structural success when the payload also has typed errors", () => {
  expect(
    resolveDeleteSavedComparisonSetMutationOutcome(
      { savedComparisonSet: { id: "saved-set-1" }, errors: [MUTATION_ERROR] },
      []
    )
  ).toEqual({ deletedSavedComparisonSetId: "saved-set-1", error: null });
});

test("resolveDeleteSavedComparisonSetMutationOutcome uses the payload error when the deleted ID is missing", () => {
  expect(
    resolveDeleteSavedComparisonSetMutationOutcome(
      { savedComparisonSet: null, errors: [MUTATION_ERROR] },
      []
    )
  ).toEqual({ deletedSavedComparisonSetId: null, error: MUTATION_ERROR.message });
});

test("resolveDeleteSavedComparisonSetMutationOutcome gives top-level GraphQL errors precedence over a deleted ID", () => {
  expect(
    resolveDeleteSavedComparisonSetMutationOutcome(
      { savedComparisonSet: { id: "saved-set-1" }, errors: [MUTATION_ERROR] },
      [{ message: "database stacktrace" }]
    )
  ).toEqual({
    deletedSavedComparisonSetId: null,
    error: DEFAULT_ROUTE_ERROR_MESSAGE
  });
});

test.each([undefined, null])(
  "resolveDeleteSavedComparisonSetMutationOutcome uses the shared fallback for a %s payload",
  (payload) => {
    expect(resolveDeleteSavedComparisonSetMutationOutcome(payload, [])).toEqual({
      deletedSavedComparisonSetId: null,
      error: DEFAULT_ROUTE_ERROR_MESSAGE
    });
  }
);
