import { routeMutationErrorMessage } from "../../route-errors";

type MutationPayload = {
  errors?: unknown;
};

export function resolveTogglePriceWatchMutationError(
  payload: (MutationPayload & { watch?: unknown }) | null | undefined,
  graphQLErrors?: readonly unknown[] | null,
) {
  return payload?.watch ? null : routeMutationErrorMessage(payload?.errors, graphQLErrors);
}

export function resolveDeletePriceWatchMutationError(
  payload: (MutationPayload & { deletedWatchId?: unknown }) | null | undefined,
  graphQLErrors?: readonly unknown[] | null,
) {
  return payload?.deletedWatchId ? null : routeMutationErrorMessage(payload?.errors, graphQLErrors);
}

export function resolveMarkAlertReadMutationError(
  payload: (MutationPayload & { event?: unknown }) | null | undefined,
  graphQLErrors?: readonly unknown[] | null,
) {
  return payload?.event ? null : routeMutationErrorMessage(payload?.errors, graphQLErrors);
}
