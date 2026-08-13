import { DEFAULT_MUTATION_ERROR_MESSAGE } from "../../../src/relay/mutation-errors";
import {
  SAVED_COMPARISON_SUCCESS_MESSAGE,
  buildSavedComparisonSetMutationInput,
  resolveSavedComparisonSetMutationOutcome,
} from "../../../src/routes/compare/saved/saved-comparison-mutation";

const MUTATION_ERROR = {
  code: "INVALID_ARGUMENT",
  field: "productIds",
  message: "Choose at least one product.",
};

test("buildSavedComparisonSetMutationInput uses the naming fallback for an empty selection", () => {
  expect(buildSavedComparisonSetMutationInput([])).toEqual({
    name: "Saved comparison",
    productIds: [],
  });
});

test("buildSavedComparisonSetMutationInput trims nonblank names without changing product order", () => {
  const products = [
    { id: "product-2", name: "  Desk Lamp  " },
    { id: "product-1", name: "   " },
    { id: "product-3", name: "  Desk Chair" },
  ];

  expect(buildSavedComparisonSetMutationInput(products)).toEqual({
    name: "Desk Lamp vs Desk Chair",
    productIds: ["product-2", "product-1", "product-3"],
  });
});

test("buildSavedComparisonSetMutationInput uses singular comparison copy", () => {
  expect(
    buildSavedComparisonSetMutationInput([{ id: "product-1", name: "  Desk Lamp  " }]),
  ).toEqual({
    name: "Desk Lamp comparison",
    productIds: ["product-1"],
  });
});

test("buildSavedComparisonSetMutationInput preserves duplicate product IDs and source immutability", () => {
  const products = [
    { id: "product-2", name: "Second" },
    { id: "product-1", name: "First" },
    { id: "product-2", name: "Second" },
  ];

  const input = buildSavedComparisonSetMutationInput(products);

  expect(input).toEqual({
    name: "Second vs First vs Second",
    productIds: ["product-2", "product-1", "product-2"],
  });
  expect(input.productIds).not.toBe(products);
  expect(products).toEqual([
    { id: "product-2", name: "Second" },
    { id: "product-1", name: "First" },
    { id: "product-2", name: "Second" },
  ]);
});

test("resolveSavedComparisonSetMutationOutcome reports the exact success copy for a structural completion", () => {
  expect(
    resolveSavedComparisonSetMutationOutcome(
      {
        savedComparisonSet: { id: "saved-set-1" },
        errors: [MUTATION_ERROR],
      },
      [],
    ),
  ).toEqual({ error: null, message: SAVED_COMPARISON_SUCCESS_MESSAGE });
  expect(SAVED_COMPARISON_SUCCESS_MESSAGE).toBe("Comparison saved.");
});

test("resolveSavedComparisonSetMutationOutcome uses the payload error when the saved-set ID is missing", () => {
  expect(
    resolveSavedComparisonSetMutationOutcome(
      { savedComparisonSet: null, errors: [MUTATION_ERROR] },
      [],
    ),
  ).toEqual({ error: MUTATION_ERROR.message, message: null });
});

test("resolveSavedComparisonSetMutationOutcome gives top-level GraphQL errors precedence", () => {
  expect(
    resolveSavedComparisonSetMutationOutcome(
      {
        savedComparisonSet: { id: "saved-set-1" },
        errors: [MUTATION_ERROR],
      },
      [{ message: "database stacktrace" }],
    ),
  ).toEqual({ error: DEFAULT_MUTATION_ERROR_MESSAGE, message: null });
});
