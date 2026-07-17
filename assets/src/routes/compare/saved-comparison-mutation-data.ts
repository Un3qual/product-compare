import { hasRouteGraphQLErrors, routeMutationErrorMessage } from "../route-errors";
import { buildSavedComparisonName } from "./saved-comparison-name-data";

type SavedComparisonMutationProduct = {
  readonly id: string;
  readonly name: string;
};

type SavedComparisonSetPayload = {
  readonly errors?: unknown;
  readonly savedComparisonSet?: { readonly id?: unknown } | null;
};

export const SAVED_COMPARISON_SUCCESS_MESSAGE = "Comparison saved.";

export function buildSavedComparisonSetMutationInput(
  products: readonly SavedComparisonMutationProduct[]
) {
  return {
    name: buildSavedComparisonName(products),
    productIds: products.map((product) => product.id)
  };
}

export function resolveSavedComparisonSetMutationOutcome(
  payload: SavedComparisonSetPayload | null | undefined,
  graphQLErrors?: readonly unknown[] | null
) {
  if (payload?.savedComparisonSet?.id && !hasRouteGraphQLErrors(graphQLErrors)) {
    return { error: null, message: SAVED_COMPARISON_SUCCESS_MESSAGE };
  }

  return {
    error: routeMutationErrorMessage(payload?.errors, graphQLErrors),
    message: null
  };
}
