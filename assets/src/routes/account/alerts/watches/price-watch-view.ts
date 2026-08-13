import type { AlertsRoute_watch$data } from "$generated/AlertsRoute_watch.graphql";

export type PriceWatchViewSource = Pick<
  AlertsRoute_watch$data,
  "baselineLandedPrice" | "currency" | "enabled" | "percentageDrop" | "ruleType" | "targetAmount"
>;

const PRICE_WATCH_RULE_LABELS: Readonly<Record<string, string>> = {
  TARGET_PRICE: "Target reached",
  PERCENTAGE_DROP: "Price drop reached",
  BACK_IN_STOCK: "Back in stock",
  NEWLY_AVAILABLE: "Newly available",
};

export function buildAlertsViewData<TAlert, TWatch extends Pick<PriceWatchViewSource, "enabled">>(
  alerts: readonly TAlert[],
  watches: readonly TWatch[],
) {
  return {
    alerts,
    activeWatches: watches.filter((watch) => watch.enabled),
    pausedWatches: watches.filter((watch) => !watch.enabled),
  };
}

export function priceWatchLabel(watch: PriceWatchViewSource) {
  if (watch.ruleType === "TARGET_PRICE") {
    return `Target ${watch.targetAmount ?? "—"} ${watch.currency}`;
  }

  if (watch.ruleType === "PERCENTAGE_DROP") {
    return `${watch.percentageDrop ?? "—"}% below ${watch.baselineLandedPrice ?? "baseline"} ${watch.currency}`;
  }

  return PRICE_WATCH_RULE_LABELS[watch.ruleType] ?? "Watch matched";
}

export function priceWatchToggleControl(watch: PriceWatchViewSource) {
  return {
    nextEnabled: !watch.enabled,
    label: watch.enabled ? "Pause" : "Resume",
  };
}
