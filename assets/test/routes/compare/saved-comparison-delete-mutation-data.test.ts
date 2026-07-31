import { DEFAULT_ROUTE_ERROR_MESSAGE } from "../../../src/routes/route-errors";
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

test.each([
  ["is omitted", { errors: [MUTATION_ERROR] }, MUTATION_ERROR.message],
  ["is empty", { savedComparisonSet: {}, errors: [MUTATION_ERROR] }, MUTATION_ERROR.message],
  ["has a null ID", { savedComparisonSet: { id: null }, errors: [] }, DEFAULT_ROUTE_ERROR_MESSAGE],
])(
  "resolveDeleteSavedComparisonSetMutationOutcome uses the shared error policy when the saved comparison set %s",
  (_description, payload, error) => {
    expect(resolveDeleteSavedComparisonSetMutationOutcome(payload, [])).toEqual({
      deletedSavedComparisonSetId: null,
      error,
    });
  },
);

test("resolveDeleteSavedComparisonSetMutationOutcome gives top-level GraphQL errors precedence over a deleted ID", () => {
  expect(
    resolveDeleteSavedComparisonSetMutationOutcome(
      { savedComparisonSet: { id: "saved-set-1" }, errors: [MUTATION_ERROR] },
      [{ message: "database stacktrace" }],
    ),
  ).toEqual({
    deletedSavedComparisonSetId: null,
    error: DEFAULT_ROUTE_ERROR_MESSAGE,
  });
});

test.each([undefined, null])(
  "resolveDeleteSavedComparisonSetMutationOutcome uses the shared fallback for a %s payload",
  (payload) => {
    expect(resolveDeleteSavedComparisonSetMutationOutcome(payload, [])).toEqual({
      deletedSavedComparisonSetId: null,
      error: DEFAULT_ROUTE_ERROR_MESSAGE,
    });
  },
);
