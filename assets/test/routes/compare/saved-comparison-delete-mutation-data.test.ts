import { DEFAULT_MUTATION_ERROR_MESSAGE } from "../../../src/relay/mutation-errors";
import { resolveDeleteSavedComparisonSetMutationOutcome } from "../../../src/routes/compare/saved-comparison-delete-mutation-data";

const MUTATION_ERROR = {
  code: "BAD_USER_INPUT",
  field: "savedComparisonSetId",
  message: "Could not delete this comparison set.",
};

test("resolveDeleteSavedComparisonSetMutationOutcome returns the deleted ID for a complete payload", () => {
  expect(
    resolveDeleteSavedComparisonSetMutationOutcome(
      { savedComparisonSet: { id: "saved-set-1" }, errors: [] },
      [],
    ),
  ).toEqual({ deletedSavedComparisonSetId: "saved-set-1", error: null });
});

test("resolveDeleteSavedComparisonSetMutationOutcome keeps structural success when the payload also has typed errors", () => {
  expect(
    resolveDeleteSavedComparisonSetMutationOutcome(
      { savedComparisonSet: { id: "saved-set-1" }, errors: [MUTATION_ERROR] },
      [],
    ),
  ).toEqual({ deletedSavedComparisonSetId: "saved-set-1", error: null });
});

test("resolveDeleteSavedComparisonSetMutationOutcome uses the payload error when the deleted ID is missing", () => {
  expect(
    resolveDeleteSavedComparisonSetMutationOutcome(
      { savedComparisonSet: null, errors: [MUTATION_ERROR] },
      [],
    ),
  ).toEqual({ deletedSavedComparisonSetId: null, error: MUTATION_ERROR.message });
});

test("resolveDeleteSavedComparisonSetMutationOutcome gives top-level GraphQL errors precedence over a deleted ID", () => {
  expect(
    resolveDeleteSavedComparisonSetMutationOutcome(
      { savedComparisonSet: { id: "saved-set-1" }, errors: [MUTATION_ERROR] },
      [{ message: "database stacktrace" }],
    ),
  ).toEqual({
    deletedSavedComparisonSetId: null,
    error: DEFAULT_MUTATION_ERROR_MESSAGE,
  });
});
