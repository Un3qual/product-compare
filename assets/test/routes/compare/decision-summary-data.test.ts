import { buildDecisionSummaryMetricRows } from "../../../src/routes/compare/decision-summary-data";

type AvailableOfferContext = {
  status: "available";
  productId: string;
  activeOfferCount: number;
  bestCurrentPrice: {
    currency: string;
    merchantName: string | null;
    price: string;
  } | null;
  hasLoadedCoupons: boolean;
  hasMoreActiveOffers: boolean;
  hasMoreCoupons: boolean;
  latestPriceObservedAt: string | null;
};

test("buildDecisionSummaryMetricRows returns exact metric labels and unavailable cells", () => {
  const rows = buildDecisionSummaryMetricRows([{ id: "first" }, { id: "second" }], {
    first: availableContext("first", {
      activeOfferCount: 3,
      bestCurrentPrice: {
        currency: "USD",
        merchantName: "Value Mart",
        price: "199.99",
      },
      hasLoadedCoupons: true,
      hasMoreActiveOffers: true,
      hasMoreCoupons: true,
      latestPriceObservedAt: "2026-06-29T12:00:00Z",
    }),
    second: { status: "unavailable", productId: "second" },
  });

  expect(rows).toEqual([
    metricRow("relative-loaded-price", "Relative loaded price", [
      ["first", "Not comparable"],
      ["second", "Not comparable"],
    ]),
    metricRow("best-price", "Best current price", [
      ["first", "199.99 USD at Value Mart"],
      ["second", "Offer context unavailable"],
    ]),
    metricRow("offer-count", "Active offer count", [
      ["first", "3 loaded; More available"],
      ["second", "Unavailable"],
    ]),
    metricRow("coupon-signal", "Coupon signal", [
      ["first", "More coupons available"],
      ["second", "Unavailable"],
    ]),
    metricRow("price-recency", "Price recency", [
      ["first", "2026-06-29"],
      ["second", "Unavailable"],
    ]),
  ]);
});

test("buildDecisionSummaryMetricRows compares decimal and exponent prices exactly", () => {
  const relativePriceCells = relativeLoadedPriceCells(["first", "second", "third"], {
    first: availableContext("first", { bestCurrentPrice: price("1E+3") }),
    second: availableContext("second", { bestCurrentPrice: price("1000.00") }),
    third: availableContext("third", { bestCurrentPrice: price("1200") }),
  });

  expect(relativePriceCells).toEqual([
    "Tied for lowest loaded price",
    "Tied for lowest loaded price",
    "Above lowest loaded price",
  ]);
});

test("buildDecisionSummaryMetricRows declines mixed currencies", () => {
  const relativePriceCells = relativeLoadedPriceCells(["first", "second"], {
    first: availableContext("first", { bestCurrentPrice: price("99.99", "USD") }),
    second: availableContext("second", { bestCurrentPrice: price("89.99", "EUR") }),
  });

  expect(relativePriceCells).toEqual(["Not comparable", "Not comparable"]);
});

test("buildDecisionSummaryMetricRows compares safe prices around malformed and missing values", () => {
  const productIds = ["lowest", "higher", "malformed", "missing", "unavailable"];
  const relativePriceCells = relativeLoadedPriceCells(productIds, {
    lowest: availableContext("lowest", { bestCurrentPrice: price("5") }),
    higher: availableContext("higher", { bestCurrentPrice: price("10") }),
    malformed: availableContext("malformed", { bestCurrentPrice: price("not-a-price") }),
    missing: availableContext("missing"),
    unavailable: { status: "unavailable", productId: "unavailable" },
  });

  expect(relativePriceCells).toEqual([
    "Lowest loaded price",
    "Above lowest loaded price",
    "Not comparable",
    "Not comparable",
    "Not comparable",
  ]);
});

test.each([
  ["an impossible date", "2026-02-30T10:15:00Z"],
  ["a timestamp without an offset", "2026-06-29T10:15:00"],
  ["a malformed timestamp", "not-a-date"],
])("buildDecisionSummaryMetricRows rejects %s as price recency", (_caseName, observedAt) => {
  const rows = buildDecisionSummaryMetricRows([{ id: "first" }], {
    first: availableContext("first", { latestPriceObservedAt: observedAt }),
  });
  const valuesByKey = Object.fromEntries(rows.map((row) => [row.key, row.cells[0]?.value]));

  expect(valuesByKey).toEqual({
    "relative-loaded-price": "Not comparable",
    "best-price": "No current price loaded",
    "offer-count": "0 loaded",
    "coupon-signal": "No coupons loaded",
    "price-recency": "No price observations loaded",
  });
});

test("buildDecisionSummaryMetricRows preserves valid explicit-offset date labels", () => {
  const rows = buildDecisionSummaryMetricRows([{ id: "first" }], {
    first: availableContext("first", {
      latestPriceObservedAt: "2026-06-29T20:30:00-04:00",
    }),
  });

  expect(rows.find((row) => row.key === "price-recency")?.cells).toEqual([
    { productId: "first", value: "2026-06-29" },
  ]);
});

function relativeLoadedPriceCells(
  productIds: string[],
  offerContexts: Record<
    string,
    AvailableOfferContext | { status: "unavailable"; productId: string }
  >,
) {
  const relativePriceRow = buildDecisionSummaryMetricRows(
    productIds.map((id) => ({ id })),
    offerContexts,
  ).find((row) => row.key === "relative-loaded-price");

  return relativePriceRow?.cells.map((cell) => cell.value);
}

function availableContext(
  productId: string,
  overrides: Partial<Omit<AvailableOfferContext, "productId" | "status">> = {},
): AvailableOfferContext {
  return {
    status: "available",
    productId,
    activeOfferCount: 0,
    bestCurrentPrice: null,
    hasLoadedCoupons: false,
    hasMoreActiveOffers: false,
    hasMoreCoupons: false,
    latestPriceObservedAt: null,
    ...overrides,
  };
}

function price(value: string, currency = "USD") {
  return { currency, merchantName: "Merchant", price: value };
}

function metricRow(key: string, label: string, cells: Array<[productId: string, value: string]>) {
  return {
    key,
    label,
    cells: cells.map(([productId, value]) => ({ productId, value })),
  };
}
