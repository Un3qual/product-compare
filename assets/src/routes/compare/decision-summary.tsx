import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { compareDecimalStrings } from "../decimal-values";
import type {
  CompareOfferContextSummary,
  CompareProductSummary,
  CompareRouteLoaderData
} from "./loader";

const DECISION_SUMMARY_METRICS: DecisionSummaryMetric[] = [
  {
    key: "best-price",
    label: "Best current price",
    valueLabel: bestCurrentPriceLabel
  },
  {
    key: "offer-count",
    label: "Active offer count",
    valueLabel: activeOfferCountLabel
  },
  {
    key: "coupon-signal",
    label: "Coupon signal",
    valueLabel: couponSignalLabel
  },
  {
    key: "price-recency",
    label: "Price recency",
    valueLabel: priceRecencyLabel
  }
];

interface DecisionSummaryMetric {
  key: string;
  label: string;
  valueLabel: (context: CompareOfferContextSummary) => string;
}

type ComparablePrice = {
  currency: string;
  productId: string;
  value: string;
};

export function DecisionSummary({
  offerContexts,
  products
}: {
  offerContexts: Extract<CompareRouteLoaderData, { status: "ready" }>["offerContexts"];
  products: CompareProductSummary[];
}) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section>
      <h2>Decision summary</h2>
      <table aria-label="Decision summary">
        <DecisionSummaryHeader products={products} />
        <tbody>
          <DecisionSummaryMetricRows offerContexts={offerContexts} products={products} />
          <ReviewOffersRow products={products} />
        </tbody>
      </table>
    </section>
  );
}

function DecisionSummaryHeader({ products }: { products: CompareProductSummary[] }) {
  return (
    <thead>
      <tr>
        <th scope="col">Decision</th>
        {products.map((product) => (
          <th key={product.id} scope="col">
            {product.name}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function DecisionSummaryMetricRows({
  offerContexts,
  products
}: {
  offerContexts: Extract<CompareRouteLoaderData, { status: "ready" }>["offerContexts"];
  products: CompareProductSummary[];
}) {
  const relativePriceLabels = relativeLoadedPriceLabels(products, offerContexts);

  return (
    <>
      <DecisionSummaryRow
        cellKey="relative-loaded-price"
        label="Relative loaded price"
        products={products}
        renderCell={(product) => relativePriceLabels.get(product.id) ?? "Not comparable"}
      />
      {DECISION_SUMMARY_METRICS.map((metric) => (
        <DecisionSummaryRow
          key={metric.key}
          cellKey={metric.key}
          label={metric.label}
          products={products}
          renderCell={(product) =>
            metric.valueLabel(offerContextForProduct(offerContexts, product.id))
          }
        />
      ))}
    </>
  );
}

function relativeLoadedPriceLabels(
  products: CompareProductSummary[],
  offerContexts: Extract<CompareRouteLoaderData, { status: "ready" }>["offerContexts"]
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
    compareDecimalStrings(candidate.value, current.value) === -1 ? candidate : current
  );
  const minimumCount = comparablePrices.filter(
    ({ value }) => compareDecimalStrings(value, minimum.value) === 0
  ).length;
  const comparableByProductId = new Map(
    comparablePrices.map((price) => [price.productId, price])
  );

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
            ? "Tied for lowest loaded price"
            : "Lowest loaded price"
          : "Above lowest loaded price"
      ] as const;
    })
  );
}

function ReviewOffersRow({ products }: { products: CompareProductSummary[] }) {
  return (
    <DecisionSummaryRow
      cellKey="review-offers"
      label="Review offers link"
      products={products}
      renderCell={(product) => (
        <Link to={`/offers?productId=${encodeURIComponent(product.id)}`}>
          Review {product.name} offers
        </Link>
      )}
    />
  );
}

function DecisionSummaryRow({
  cellKey,
  label,
  products,
  renderCell
}: {
  cellKey: string;
  label: string;
  products: CompareProductSummary[];
  renderCell: (product: CompareProductSummary) => ReactNode;
}) {
  return (
    <tr>
      <th scope="row">{label}</th>
      {products.map((product) => (
        <td key={`${product.id}-${cellKey}`}>{renderCell(product)}</td>
      ))}
    </tr>
  );
}

function offerContextForProduct(
  offerContexts: Extract<CompareRouteLoaderData, { status: "ready" }>["offerContexts"] | undefined,
  productId: string
): CompareOfferContextSummary {
  return offerContexts?.[productId] ?? { status: "unavailable", productId };
}

function bestCurrentPriceLabel(context: CompareOfferContextSummary) {
  if (context.status === "unavailable") {
    return "Offer context unavailable";
  }

  if (!context.bestCurrentPrice) {
    return "No current price loaded";
  }

  return `${context.bestCurrentPrice.price} ${context.bestCurrentPrice.currency} at ${
    context.bestCurrentPrice.merchantName ?? "Unknown merchant"
  }`;
}

function activeOfferCountLabel(context: CompareOfferContextSummary) {
  if (context.status === "unavailable") {
    return "Unavailable";
  }

  return context.hasMoreActiveOffers
    ? `${context.activeOfferCount} loaded; More available`
    : `${context.activeOfferCount} loaded`;
}

function couponSignalLabel(context: CompareOfferContextSummary) {
  if (context.status === "unavailable") {
    return "Unavailable";
  }

  if (context.hasMoreCoupons) {
    return "More coupons available";
  }

  return context.hasLoadedCoupons ? "Coupons available" : "No coupons loaded";
}

function priceRecencyLabel(context: CompareOfferContextSummary) {
  if (context.status === "unavailable") {
    return "Unavailable";
  }

  return dateLabel(context.latestPriceObservedAt) ?? "No price observations loaded";
}

function dateLabel(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : value.slice(0, 10);
}
