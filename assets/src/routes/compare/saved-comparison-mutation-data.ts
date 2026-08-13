import type { CompareRouteCreateSavedComparisonSetMutation } from "$generated/CompareRouteCreateSavedComparisonSetMutation.graphql";
import {
  hasGraphQLErrors,
  mutationErrorMessage,
  type MutationGraphQLErrors,
} from "$relay/mutation-errors";
import { buildSavedComparisonName } from "./saved-comparison-name-data";

type SavedComparisonMutationProduct = {
  readonly id: string;
  readonly name: string;
};

type SavedComparisonSetPayload =
  CompareRouteCreateSavedComparisonSetMutation["response"]["createSavedComparisonSet"];

export const SAVED_COMPARISON_SUCCESS_MESSAGE = "Comparison saved.";

export function buildSavedComparisonSetMutationInput(
  products: readonly SavedComparisonMutationProduct[],
) {
  return {
    name: buildSavedComparisonName(products),
    productIds: products.map((product) => product.id),
  };
}

export function resolveSavedComparisonSetMutationOutcome(
  payload: SavedComparisonSetPayload,
  graphQLErrors: MutationGraphQLErrors = undefined,
) {
  if (payload.savedComparisonSet?.id && !hasGraphQLErrors(graphQLErrors)) {
    return { error: null, message: SAVED_COMPARISON_SUCCESS_MESSAGE };
  }

  return {
    error: mutationErrorMessage(payload.errors, graphQLErrors),
    message: null,
  };
}
