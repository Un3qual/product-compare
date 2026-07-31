import {
  buildRevenueSummaryControls,
  buildRevenueSummaryFilterFormData,
  buildRevenueSummaryMetrics,
} from "../../../../src/routes/commerce/revenue/revenue-summary-view-data";

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

test("buildRevenueSummaryMetrics hides every value when the summary is suppressed", () => {
  expect(
    buildRevenueSummaryMetrics(
      {
        metrics: {
          averagePaidPrice: "80.00",
          clicks: 2,
          commissionRevenue: "20.00",
          conversions: 2,
          grossOrderValue: "200.00",
        },
        suppression: { suppressed: true },
      },
      "USD",
    ),
  ).toEqual([
    { label: "Clicks", value: "Hidden" },
    { label: "Conversions", value: "Hidden" },
    { label: "Gross order value", value: "Hidden" },
    { label: "Commission revenue", value: "Hidden" },
    { label: "Average paid price", value: "Hidden" },
  ]);
});

test("buildRevenueSummaryMetrics preserves null and empty-string amount semantics", () => {
  expect(
    buildRevenueSummaryMetrics(
      {
        metrics: {
          averagePaidPrice: null,
          clicks: null,
          commissionRevenue: undefined,
          conversions: 0,
          grossOrderValue: "",
        },
        suppression: { suppressed: false },
      },
      "USD",
    ),
  ).toEqual([
    { label: "Clicks", value: "Not available" },
    { label: "Conversions", value: "0" },
    { label: "Gross order value", value: " USD" },
    { label: "Commission revenue", value: "Not available" },
    { label: "Average paid price", value: "Not available" },
  ]);
});
