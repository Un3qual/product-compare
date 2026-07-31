import { graphQLDateTimeLabel } from "../../graphql-datetime";

export type PriceAlertViewSource = {
  ruleType: string;
  observedAt: string;
};

export type PriceWatchViewSource = {
  ruleType: string;
  currency: string;
  targetAmount: string | null;
  percentageDrop: string | null;
  baselineLandedPrice: string | null;
  enabled: boolean;
};

const ALERT_RULE_LABELS: Readonly<Record<string, string>> = {
  TARGET_PRICE: "Target reached",
  PERCENTAGE_DROP: "Price drop reached",
  BACK_IN_STOCK: "Back in stock",
  NEWLY_AVAILABLE: "Newly available",
};

export function buildAlertsViewData<
  TAlert extends PriceAlertViewSource,
  TWatch extends PriceWatchViewSource,
>(alerts: readonly TAlert[], watches: readonly TWatch[]) {
  return {
    alerts,
    activeWatches: watches.filter((watch) => watch.enabled),
    pausedWatches: watches.filter((watch) => !watch.enabled),
  };
}

export function alertRuleLabel(ruleType: string) {
  return ALERT_RULE_LABELS[ruleType] ?? "Watch matched";
}

export function priceWatchLabel(watch: PriceWatchViewSource) {
  if (watch.ruleType === "TARGET_PRICE") {
    return `Target ${watch.targetAmount ?? "—"} ${watch.currency}`;
  }

  if (watch.ruleType === "PERCENTAGE_DROP") {
    return `${watch.percentageDrop ?? "—"}% below ${watch.baselineLandedPrice ?? "baseline"} ${watch.currency}`;
  }

  return alertRuleLabel(watch.ruleType);
}

export function priceWatchToggleControl(watch: PriceWatchViewSource) {
  return {
    nextEnabled: !watch.enabled,
    label: watch.enabled ? "Pause" : "Resume",
  };
}

export function observationDateLabel(value: string) {
  return graphQLDateTimeLabel(value) ?? value;
}
