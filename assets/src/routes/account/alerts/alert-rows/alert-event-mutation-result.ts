import type { AlertOperationsMarkAlertReadMutation } from "$generated/AlertOperationsMarkAlertReadMutation.graphql";
import { mutationErrorMessage, type MutationGraphQLErrors } from "$relay/mutation-errors";

export function resolveMarkAlertReadMutationError(
  payload: AlertOperationsMarkAlertReadMutation["response"]["markAlertRead"],
  graphQLErrors: MutationGraphQLErrors = null,
) {
  return payload.event ? null : mutationErrorMessage(payload.errors, graphQLErrors);
}
