import { compareDecimalStrings } from "../decimal-values";
import { graphQLDateTimeLabel } from "../graphql-datetime";

export type DecisionSummaryMetricKey =
  | "relative-loaded-price"
  | "best-price"
  | "offer-count"
  | "coupon-signal"
  | "price-recency";

export interface DecisionSummaryProduct {
  id: string;
}

export type DecisionSummaryOfferContext =
  | DecisionSummaryAvailableOfferContext
  | DecisionSummaryUnavailableOfferContext;

export interface DecisionSummaryAvailableOfferContext {
  status: "available";
  productId: string;
  activeOfferCount: number;
  bestCurrentPrice: DecisionSummaryBestCurrentPrice | null;
  hasLoadedCoupons: boolean;
  hasMoreActiveOffers: boolean;
  hasMoreCoupons: boolean;
  latestPriceObservedAt: string | null;
}

export interface DecisionSummaryUnavailableOfferContext {
  status: "unavailable";
  productId: string;
}

export interface DecisionSummaryBestCurrentPrice {
  currency: string;
  merchantName: string | null;
  price: string;
}

export interface DecisionSummaryMetricCell {
  productId: string;
  value: string;
}

export interface DecisionSummaryMetricRow {
  key: DecisionSummaryMetricKey;
  label: string;
  cells: DecisionSummaryMetricCell[];
}

interface DecisionSummaryMetricDefinition {
  key: Exclude<DecisionSummaryMetricKey, "relative-loaded-price">;
  label: string;
  value: (context: DecisionSummaryOfferContext) => string;
}

interface ComparablePrice {
  currency: string;
  productId: string;
  value: string;
}

const DECISION_SUMMARY_METRICS: readonly DecisionSummaryMetricDefinition[] = [
  {
    key: "best-price",
    label: "Lowest current price",
    value: bestCurrentPriceLabel,
  },
  {
    key: "offer-count",
    label: "Offers found",
    value: activeOfferCountLabel,
  },
  {
    key: "coupon-signal",
    label: "Coupon availability",
    value: couponSignalLabel,
  },
  {
    key: "price-recency",
    label: "Price last checked",
    value: priceRecencyLabel,
  },
];

export function buildDecisionSummaryMetricRows(
  products: readonly DecisionSummaryProduct[],
  offerContexts: Readonly<Record<string, DecisionSummaryOfferContext>> | undefined,
): DecisionSummaryMetricRow[] {
  const relativePriceLabels = relativeLoadedPriceLabels(products, offerContexts);

  return [
    {
      key: "relative-loaded-price",
      label: "Compared price",
      cells: products.map(({ id }) => ({
        productId: id,
        value: relativePriceLabels.get(id) ?? "Not comparable",
      })),
    },
    ...DECISION_SUMMARY_METRICS.map((metric) => ({
      key: metric.key,
      label: metric.label,
      cells: products.map(({ id }) => ({
        productId: id,
        value: metric.value(offerContextForProduct(offerContexts, id)),
      })),
    })),
  ];
}

function relativeLoadedPriceLabels(
  products: readonly DecisionSummaryProduct[],
  offerContexts: Readonly<Record<string, DecisionSummaryOfferContext>> | undefined,
) {
  const unavailable = new Map(products.map(({ id }) => [id, "Not comparable"]));

  if (products.length < 2) {
    return unavailable;
  }

  const comparablePrices = products.flatMap((product): ComparablePrice[] => {
    const context = offerContextForProduct(offerContexts, product.id);

    if (context.status === "unavailable" || !context.bestCurrentPrice) {
      return [];
    }

    const value = context.bestCurrentPrice.price;
    const comparisonToZero = compareDecimalStrings(value, "0");

    return comparisonToZero !== null && comparisonToZero >= 0
      ? [{ currency: context.bestCurrentPrice.currency, productId: product.id, value }]
      : [];
  });

  if (
    comparablePrices.length < 2 ||
    new Set(comparablePrices.map(({ currency }) => currency)).size !== 1
  ) {
    return unavailable;
  }

  const minimum = comparablePrices.reduce((current, candidate) =>
    compareDecimalStrings(candidate.value, current.value) === -1 ? candidate : current,
  );
  const minimumCount = comparablePrices.filter(
    ({ value }) => compareDecimalStrings(value, minimum.value) === 0,
  ).length;
  const comparableByProductId = new Map(comparablePrices.map((price) => [price.productId, price]));

  return new Map(
    products.map(({ id }) => {
      const price = comparableByProductId.get(id);

      if (!price) {
        return [id, "Not comparable"] as const;
      }

      return [
        id,
        compareDecimalStrings(price.value, minimum.value) === 0
          ? minimumCount > 1
            ? "Tied for lowest shown price"
            : "Lowest shown price"
          : "Above lowest shown price",
      ] as const;
    }),
  );
}

function offerContextForProduct(
  offerContexts: Readonly<Record<string, DecisionSummaryOfferContext>> | undefined,
  productId: string,
): DecisionSummaryOfferContext {
  return offerContexts?.[productId] ?? { status: "unavailable", productId };
}

function bestCurrentPriceLabel(context: DecisionSummaryOfferContext) {
  if (context.status === "unavailable") {
    return "Offer details unavailable";
  }

  if (!context.bestCurrentPrice) {
    return "No current price available";
  }

  return `${context.bestCurrentPrice.price} ${context.bestCurrentPrice.currency} at ${
    context.bestCurrentPrice.merchantName ?? "Unknown merchant"
  }`;
}

function activeOfferCountLabel(context: DecisionSummaryOfferContext) {
  if (context.status === "unavailable") {
    return "Unavailable";
  }

  return context.hasMoreActiveOffers
    ? `${context.activeOfferCount} shown; More available`
    : `${context.activeOfferCount} shown`;
}

function couponSignalLabel(context: DecisionSummaryOfferContext) {
  if (context.status === "unavailable") {
    return "Unavailable";
  }

  if (context.hasMoreCoupons) {
    return "More coupons available";
  }

  return context.hasLoadedCoupons ? "Coupons available" : "No coupons found";
}

function priceRecencyLabel(context: DecisionSummaryOfferContext) {
  if (context.status === "unavailable") {
    return "Unavailable";
  }

  return dateLabel(context.latestPriceObservedAt) ?? "No price check available";
}

function dateLabel(value: string | null | undefined) {
  return graphQLDateTimeLabel(value);
}
