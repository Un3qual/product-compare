import {
  buildRevenueSummaryControls,
  buildRevenueSummaryFilterFormData,
  buildRevenueDashboardMetrics,
} from "../../../../src/routes/commerce/revenue/summary/revenue-summary-data";
import {
  buildAttributionOutcome,
  selectRecentLoadedConversion,
} from "../../../../src/routes/commerce/revenue/attribution/attribution-ledger-data";

test("buildRevenueSummaryFilterFormData normalizes only nullish form values", () => {
  expect(
    buildRevenueSummaryFilterFormData({
      currency: undefined,
      from: "",
      network: null,
      to: "2026-07-17",
    }),
  ).toEqual({
    key: JSON.stringify(["", "", "", "2026-07-17"]),
    values: {
      currency: "",
      from: "",
      network: "",
      to: "2026-07-17",
    },
  });
});

test("buildRevenueSummaryFilterFormData preserves exact non-null values", () => {
  expect(
    buildRevenueSummaryFilterFormData({
      currency: "USD",
      network: "impact|partner",
    }).values,
  ).toEqual({
    currency: "USD",
    from: "",
    network: "impact|partner",
    to: "",
  });
});

test("buildRevenueSummaryFilterFormData avoids delimiter collisions", () => {
  const firstKey = buildRevenueSummaryFilterFormData({
    currency: "USD",
    network: "impact|partner",
  }).key;
  const secondKey = buildRevenueSummaryFilterFormData({
    currency: "partner|USD",
    network: "impact",
  }).key;

  expect(firstKey).not.toBe(secondKey);
});

test("buildRevenueSummaryControls preserves filter ordering and local-calendar preset URLs", () => {
  const originalTimeZone = process.env.TZ;
  process.env.TZ = "America/Los_Angeles";

  try {
    const controls = buildRevenueSummaryControls(
      {
        currency: "USD",
        from: "2026-06-30",
        network: "impact",
        to: "2026-06-01",
      },
      new Date("2026-06-28T06:30:00.000Z"),
    );

    expect(controls.activeFilters).toEqual([
      { label: "Network", value: "impact" },
      { label: "Currency", value: "USD" },
      { label: "Date range", value: "2026-06-30 to 2026-06-01" },
    ]);
    expect(controls.datePresetLinks).toEqual([
      {
        label: "Last 7 days",
        to: "/commerce/revenue?network=impact&currency=USD&from=2026-06-21&to=2026-06-27",
      },
      {
        label: "Last 30 days",
        to: "/commerce/revenue?network=impact&currency=USD&from=2026-05-29&to=2026-06-27",
      },
      {
        label: "Month to date",
        to: "/commerce/revenue?network=impact&currency=USD&from=2026-06-01&to=2026-06-27",
      },
      {
        label: "Clear dates",
        to: "/commerce/revenue?network=impact&currency=USD",
      },
    ]);
  } finally {
    process.env.TZ = originalTimeZone;
  }
});

test("buildRevenueSummaryControls returns a hydration-safe clear-dates state", () => {
  expect(
    buildRevenueSummaryControls(
      {
        currency: "EUR",
        network: "impact",
      },
      null,
    ),
  ).toEqual({
    activeFilters: [
      { label: "Network", value: "impact" },
      { label: "Currency", value: "EUR" },
    ],
    datePresetLinks: [
      {
        label: "Clear dates",
        to: "/commerce/revenue?network=impact&currency=EUR",
      },
    ],
  });
});

test("buildRevenueSummaryControls never emits an inverted preset range", () => {
  const { datePresetLinks } = buildRevenueSummaryControls({}, new Date("2026-06-27T12:00:00.000Z"));

  expect(datePresetLinks).toHaveLength(4);
  expect(
    datePresetLinks.every((link) => {
      const url = new URL(link.to, "https://example.com");
      const from = url.searchParams.get("from");
      const to = url.searchParams.get("to");

      return from === null || to === null || from <= to;
    }),
  ).toBe(true);
});

test("buildRevenueDashboardMetrics groups attribution and revenue outcomes", () => {
  expect(
    buildRevenueDashboardMetrics(
      {
        metrics: {
          averagePaidPrice: "180.00",
          clicks: 8,
          commissionRevenue: "18.00",
          conversions: 1,
          grossOrderValue: "180.00",
        },
      },
      "USD",
    ),
  ).toEqual({
    attribution: {
      clicks: "8",
      conversions: "1",
      conversionRate: "12.5%",
    },
    revenue: [
      { label: "Gross order value", value: "180.00 USD" },
      { label: "Commission revenue", value: "18.00 USD" },
      { label: "Average paid price", value: "180.00 USD" },
    ],
  });
});

test.each([
  { clicks: 0, conversions: 0, expected: "Not available" },
  { clicks: null, conversions: 1, expected: "Not available" },
  { clicks: 2, conversions: null, expected: "Not available" },
  { clicks: 2, conversions: 1, expected: "50%" },
  { clicks: 3, conversions: 1, expected: "33.3%" },
])(
  "buildRevenueDashboardMetrics formats $clicks clicks and $conversions conversions as $expected",
  ({ clicks, conversions, expected }) => {
    expect(
      buildRevenueDashboardMetrics(
        {
          metrics: {
            averagePaidPrice: null,
            clicks,
            commissionRevenue: null,
            conversions,
            grossOrderValue: null,
          },
        },
        "USD",
      ).attribution.conversionRate,
    ).toBe(expected);
  },
);

test("buildRevenueDashboardMetrics preserves null and empty-string amount semantics", () => {
  expect(
    buildRevenueDashboardMetrics(
      {
        metrics: {
          averagePaidPrice: null,
          clicks: null,
          commissionRevenue: null,
          conversions: 0,
          grossOrderValue: "",
        },
      },
      "USD",
    ),
  ).toEqual({
    attribution: {
      clicks: "Not available",
      conversions: "0",
      conversionRate: "Not available",
    },
    revenue: [
      { label: "Gross order value", value: " USD" },
      { label: "Commission revenue", value: "Not available" },
      { label: "Average paid price", value: "Not available" },
    ],
  });
});

test("selectRecentLoadedConversion selects by reported time across loaded clicks", () => {
  const earlierReported = { reportedAt: "2026-08-13T10:05:00Z", value: "earlier" };
  const laterReported = { reportedAt: "2026-08-13T11:00:00Z", value: "later" };

  expect(
    selectRecentLoadedConversion([
      { matchedConversions: [earlierReported] },
      { matchedConversions: [laterReported] },
    ]),
  ).toBe(laterReported);
});

test("selectRecentLoadedConversion keeps loaded order for equal report times", () => {
  const first = { reportedAt: "2026-08-13T11:00:00Z", value: "first" };
  const second = { reportedAt: "2026-08-13T11:00:00Z", value: "second" };

  expect(
    selectRecentLoadedConversion([
      { matchedConversions: [first] },
      { matchedConversions: [second] },
    ]),
  ).toBe(first);
  expect(selectRecentLoadedConversion([])).toBeNull();
});

test("buildAttributionOutcome preserves exact zero, one, and multiple semantics", () => {
  const paidConversion = { networkConversionRef: "paid" };
  const reversedConversion = { networkConversionRef: "reversed" };

  expect(buildAttributionOutcome([])).toEqual({ kind: "none" });
  expect(buildAttributionOutcome([paidConversion])).toEqual({
    kind: "single",
    conversion: paidConversion,
  });
  expect(buildAttributionOutcome([paidConversion, reversedConversion])).toEqual({
    kind: "multiple",
    count: 2,
  });
});
