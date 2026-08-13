import { graphQLDateTimeLabel } from "$relay/scalars";

const ALERT_RULE_LABELS: Readonly<Record<string, string>> = {
  TARGET_PRICE: "Target reached",
  PERCENTAGE_DROP: "Price drop reached",
  BACK_IN_STOCK: "Back in stock",
  NEWLY_AVAILABLE: "Newly available",
};

export function alertRuleLabel(ruleType: string) {
  return ALERT_RULE_LABELS[ruleType] ?? "Watch matched";
}

export function observationDateLabel(value: string) {
  return graphQLDateTimeLabel(value) ?? value;
}
