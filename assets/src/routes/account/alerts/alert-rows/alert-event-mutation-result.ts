import type { AlertOperationsMarkAlertReadMutation } from "$generated/AlertOperationsMarkAlertReadMutation.graphql";
import { mutationErrorMessage, type MutationGraphQLErrors } from "$relay/mutation-errors";

type MarkReadPayload = AlertOperationsMarkAlertReadMutation["response"]["markAlertRead"];

export function resolveMarkAlertReadMutationError(
  payload: MarkReadPayload,
  graphQLErrors: MutationGraphQLErrors = null,
) {
  return payload.event ? null : mutationErrorMessage(payload.errors, graphQLErrors);
}
