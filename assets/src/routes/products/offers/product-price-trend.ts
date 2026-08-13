import type { ProductDetailRouteQuery } from "$generated/ProductDetailRouteQuery.graphql";
import { decimalStringToNumber } from "$routes/decimal-values";
import { exactDateTime, shortDate } from "$ui/components/data";
import { tokens } from "$ui/theme/tokens.stylex";
import type { PriceSeriesChartSeries } from "$ui/components/data/PriceHistoryChart";

type Product = NonNullable<ProductDetailRouteQuery["response"]["product"]>;
export type ProductPriceTrendCurrency = Product["priceHistory90d"][number];
export type ProductPriceTrendMode = "average" | "lowest" | "merchants";

const merchantColors = [
  tokens.actionAccent,
  tokens.freshnessGreen,
  tokens.coupon,
  tokens.warning,
  tokens.pricePositive,
  tokens.unavailable,
] as const;

export function initialTrendCurrency(series: readonly ProductPriceTrendCurrency[]) {
  return series.find(({ currency }) => currency === "USD")?.currency ?? series[0]?.currency ?? "";
}

export function productPriceChartSeries(
  series: ProductPriceTrendCurrency,
  mode: ProductPriceTrendMode,
): PriceSeriesChartSeries[] {
  const colors = new Map(
    series.merchants.map((merchant, index) => [
      merchant.merchantProductId,
      merchantColors[index % merchantColors.length],
    ]),
  );

  if (mode === "merchants") {
    return series.merchants.map((merchant) => ({
      color: colors.get(merchant.merchantProductId) ?? tokens.actionAccent,
      id: merchant.merchantProductId,
      label: merchant.name,
      rows: series.points.flatMap((point) => {
        const merchantPrice = point.merchantPrices.find(
          ({ merchantProductId }) => merchantProductId === merchant.merchantProductId,
        );
        return merchantPrice
          ? chartRow(
              `${merchant.merchantProductId}-${String(point.observedAt)}`,
              point.observedAt,
              merchantPrice.price,
              series.currency,
            )
          : [];
      }),
    }));
  }

  const average = mode === "average";
  return [
    {
      color: tokens.actionAccent,
      id: mode,
      label: average ? "Average price" : "Lowest price",
      rows: series.points.flatMap((point) => {
        const rows = chartRow(
          `${mode}-${String(point.observedAt)}`,
          point.observedAt,
          average ? point.averagePrice : point.lowestPrice,
          series.currency,
        );

        if (average) return rows;
        return rows.map((row) => ({
          ...row,
          pointColor: colors.get(point.lowestMerchantProductId) ?? tokens.actionAccent,
        }));
      }),
    },
  ];
}

export function merchantNameByProductId(series: ProductPriceTrendCurrency) {
  return new Map(series.merchants.map(({ merchantProductId, name }) => [merchantProductId, name]));
}

function chartRow(id: string, observedAtValue: unknown, priceValue: unknown, currency: string) {
  if (typeof observedAtValue !== "string") return [];
  const observedDate = shortDate(observedAtValue);
  const observedExact = exactDateTime(observedAtValue);
  const price = decimalStringToNumber(priceValue);
  if (!observedDate || !observedExact || price === null) return [];

  return [
    {
      id,
      observedAt: observedAtValue,
      observedDate,
      observedExact,
      priceText: `${String(priceValue)} ${currency}`,
      priceValue: price,
    },
  ];
}
