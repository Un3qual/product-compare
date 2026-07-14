import {
  alertRuleLabel,
  buildAlertsViewData,
  observationDateLabel,
  priceWatchLabel
} from "../../../../src/routes/account/alerts/alerts-view-data";

const alerts = [
  { id: "alert-1", ruleType: "TARGET_PRICE", observedAt: "2026-07-13T20:00:00Z" },
  { id: "alert-2", ruleType: "BACK_IN_STOCK", observedAt: "not-a-date" }
];

const watches = [
  {
    id: "watch-active",
    ruleType: "TARGET_PRICE",
    currency: "USD",
    targetAmount: "100",
    percentageDrop: null,
    baselineLandedPrice: null,
    enabled: true
  },
  {
    id: "watch-paused",
    ruleType: "PERCENTAGE_DROP",
    currency: "EUR",
    targetAmount: null,
    percentageDrop: "15",
    baselineLandedPrice: "200",
    enabled: false
  }
];

test("buildAlertsViewData keeps alert order and partitions watches without changing their values", () => {
  const result = buildAlertsViewData(alerts, watches);

  expect(result).toEqual({
    alerts,
    activeWatches: [watches[0]],
    pausedWatches: [watches[1]]
  });
  expect(result.alerts).toBe(alerts);
});

test.each([
  ["TARGET_PRICE", "Target reached"],
  ["PERCENTAGE_DROP", "Price drop reached"],
  ["BACK_IN_STOCK", "Back in stock"],
  ["NEWLY_AVAILABLE", "Newly available"],
  ["SOMETHING_NEW", "Watch matched"]
])("alertRuleLabel maps %s to a stable customer-facing label", (ruleType, expected) => {
  expect(alertRuleLabel(ruleType)).toBe(expected);
});

test("priceWatchLabel describes threshold watches and preserves useful fallbacks", () => {
  expect(priceWatchLabel(watches[0])).toBe("Target 100 USD");
  expect(priceWatchLabel(watches[1])).toBe("15% below 200 EUR");
  expect(priceWatchLabel({
    ...watches[0],
    targetAmount: null
  })).toBe("Target — USD");
  expect(priceWatchLabel({
    ...watches[1],
    percentageDrop: null,
    baselineLandedPrice: null
  })).toBe("—% below baseline EUR");
});

test("priceWatchLabel reuses rule labels for availability and unknown watches", () => {
  expect(priceWatchLabel({ ...watches[0], ruleType: "BACK_IN_STOCK" })).toBe("Back in stock");
  expect(priceWatchLabel({ ...watches[0], ruleType: "NEWLY_AVAILABLE" })).toBe("Newly available");
  expect(priceWatchLabel({ ...watches[0], ruleType: "SOMETHING_NEW" })).toBe("Watch matched");
});

test("observationDateLabel formats valid timestamps and leaves invalid source values visible", () => {
  expect(observationDateLabel("2026-07-13T20:00:00Z")).toBe("2026-07-13");
  expect(observationDateLabel("not-a-date")).toBe("not-a-date");
});
