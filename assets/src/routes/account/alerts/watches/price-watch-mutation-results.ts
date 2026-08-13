import type { AlertOperationsDeletePriceWatchMutation } from "$generated/AlertOperationsDeletePriceWatchMutation.graphql";
import type { AlertOperationsUpdatePriceWatchMutation } from "$generated/AlertOperationsUpdatePriceWatchMutation.graphql";
import { mutationErrorMessage, type MutationGraphQLErrors } from "$relay/mutation-errors";

type TogglePayload = AlertOperationsUpdatePriceWatchMutation["response"]["updatePriceWatch"];
type DeletePayload = AlertOperationsDeletePriceWatchMutation["response"]["deletePriceWatch"];

export function resolveTogglePriceWatchMutationError(
  payload: TogglePayload,
  graphQLErrors: MutationGraphQLErrors = null,
) {
  return payload.watch ? null : mutationErrorMessage(payload.errors, graphQLErrors);
}

export function resolveDeletePriceWatchMutationError(
  payload: DeletePayload,
  graphQLErrors: MutationGraphQLErrors = null,
) {
  return payload.deletedWatchId ? null : mutationErrorMessage(payload.errors, graphQLErrors);
}
