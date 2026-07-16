import { routeMutationErrorMessage } from "../../route-errors";

type AlertMutationSource = {
  id: string;
};

type PriceWatchMutationSource = AlertMutationSource & {
  enabled: boolean;
};

type MutationPayload = {
  errors?: unknown;
};

export function buildTogglePriceWatchMutationVariables(watch: PriceWatchMutationSource) {
  return { input: { id: watch.id, enabled: !watch.enabled } };
}

export function buildDeletePriceWatchMutationVariables(watch: AlertMutationSource) {
  return { id: watch.id };
}

export function buildMarkAlertReadMutationVariables(alert: AlertMutationSource) {
  return { id: alert.id };
}

export function resolveTogglePriceWatchMutationError(
  payload: (MutationPayload & { watch?: unknown }) | null | undefined,
  graphQLErrors?: readonly unknown[] | null
) {
  return payload?.watch ? null : routeMutationErrorMessage(payload?.errors, graphQLErrors);
}

export function resolveDeletePriceWatchMutationError(
  payload: (MutationPayload & { deletedWatchId?: unknown }) | null | undefined,
  graphQLErrors?: readonly unknown[] | null
) {
  return payload?.deletedWatchId ? null : routeMutationErrorMessage(payload?.errors, graphQLErrors);
}

export function resolveMarkAlertReadMutationError(
  payload: (MutationPayload & { event?: unknown }) | null | undefined,
  graphQLErrors?: readonly unknown[] | null
) {
  return payload?.event ? null : routeMutationErrorMessage(payload?.errors, graphQLErrors);
}
