import type { CompareRouteCreateSavedComparisonSetMutation } from "$generated/CompareRouteCreateSavedComparisonSetMutation.graphql";
import {
  hasGraphQLErrors,
  mutationErrorMessage,
  type MutationGraphQLErrors,
} from "$relay/mutation-errors";

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
  graphQLErrors: MutationGraphQLErrors = null,
) {
  if (payload.savedComparisonSet?.id && !hasGraphQLErrors(graphQLErrors)) {
    return { error: null, message: SAVED_COMPARISON_SUCCESS_MESSAGE };
  }

  return {
    error: mutationErrorMessage(payload.errors, graphQLErrors),
    message: null,
  };
}

function buildSavedComparisonName(products: readonly { readonly name: string }[]) {
  const productNames = products.map((product) => product.name.trim()).filter(Boolean);

  if (productNames.length === 0) {
    return "Saved comparison";
  }

  return productNames.length === 1 ? `${productNames[0]} comparison` : productNames.join(" vs ");
}
