import { hasRouteGraphQLErrors, routeMutationErrorMessage } from "../route-errors";

type DeleteSavedComparisonSetMutationSource = {
  readonly id: string;
};

type DeleteSavedComparisonSetPayload = {
  readonly errors?: unknown;
  readonly savedComparisonSet?: { readonly id?: string | null } | null;
};

export type DeleteSavedComparisonSetMutationOutcome =
  | {
      readonly deletedSavedComparisonSetId: string;
      readonly error: null;
    }
  | {
      readonly deletedSavedComparisonSetId: null;
      readonly error: string;
    };

export function buildDeleteSavedComparisonSetMutationVariables(
  savedComparisonSet: DeleteSavedComparisonSetMutationSource
) {
  return { savedComparisonSetId: savedComparisonSet.id };
}

export function resolveDeleteSavedComparisonSetMutationOutcome(
  payload: DeleteSavedComparisonSetPayload | null | undefined,
  graphQLErrors?: readonly unknown[] | null
): DeleteSavedComparisonSetMutationOutcome {
  const deletedSavedComparisonSetId = payload?.savedComparisonSet?.id;

  if (deletedSavedComparisonSetId && !hasRouteGraphQLErrors(graphQLErrors)) {
    return { deletedSavedComparisonSetId, error: null };
  }

  return {
    deletedSavedComparisonSetId: null,
    error: routeMutationErrorMessage(payload?.errors, graphQLErrors)
  };
}
