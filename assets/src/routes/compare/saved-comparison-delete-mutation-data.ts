import type { SavedComparisonSetListDeleteSavedComparisonSetMutation } from "$generated/SavedComparisonSetListDeleteSavedComparisonSetMutation.graphql";
import {
  hasGraphQLErrors,
  mutationErrorMessage,
  type MutationGraphQLErrors,
} from "$relay/mutation-errors";

type DeleteSavedComparisonSetPayload =
  SavedComparisonSetListDeleteSavedComparisonSetMutation["response"]["deleteSavedComparisonSet"];

export type DeleteSavedComparisonSetMutationOutcome =
  | {
      readonly deletedSavedComparisonSetId: string;
      readonly error: null;
    }
  | {
      readonly deletedSavedComparisonSetId: null;
      readonly error: string;
    };

export function resolveDeleteSavedComparisonSetMutationOutcome(
  payload: DeleteSavedComparisonSetPayload,
  graphQLErrors: MutationGraphQLErrors = null,
): DeleteSavedComparisonSetMutationOutcome {
  const deletedSavedComparisonSetId = payload.savedComparisonSet?.id;

  if (deletedSavedComparisonSetId && !hasGraphQLErrors(graphQLErrors)) {
    return { deletedSavedComparisonSetId, error: null };
  }

  return {
    deletedSavedComparisonSetId: null,
    error: mutationErrorMessage(payload.errors, graphQLErrors),
  };
}
