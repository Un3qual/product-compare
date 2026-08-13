import type { ProductDetailRouteQuery } from "$generated/ProductDetailRouteQuery.graphql";
import { decimalStringToNumber } from "$relay/scalars";
import { exactDateTime, shortDate } from "$ui/components/data";
import { tokens } from "$ui/theme/tokens.stylex";
import type { PriceSeriesChartSeries } from "$ui/components/data/PriceHistoryChart";

type Product = NonNullable<ProductDetailRouteQuery["response"]["product"]>;
export type ProductPriceTrendCurrency = Product["priceHistory90d"][number];
export const PRODUCT_PRICE_TREND_MODES = [
  { label: "Lowest", value: "lowest" },
  { label: "Average", value: "average" },
  { label: "By merchant", value: "merchants" },
] as const;
export type ProductPriceTrendMode = (typeof PRODUCT_PRICE_TREND_MODES)[number]["value"];

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
  const merchantNames = merchantNameByProductId(series);
  const colors = new Map(
    series.merchants.map((merchant, index) => [
      merchant.merchantProductId,
      merchantColors[index % merchantColors.length],
    ]),
  );

  if (mode === "merchants") {
    return series.merchants.flatMap((merchant) =>
      merchantChartSegments(
        series,
        merchant.merchantProductId,
        merchant.name,
        colors.get(merchant.merchantProductId) ?? tokens.actionAccent,
      ),
    );
  }

  const average = mode === "average";
  const label = average ? "Average price" : "Lowest price";
  const segments = chartRowSegments(series, (point) =>
    chartRow(
      `${mode}-${String(point.observedAt)}`,
      point.observedAt,
      average ? point.averagePrice : point.lowestPrice,
      series.currency,
      average
        ? "Average across merchants"
        : (merchantNames.get(point.lowestMerchantProductId) ?? "Unknown merchant"),
    ).map((row) =>
      average
        ? row
        : {
            ...row,
            pointColor: colors.get(point.lowestMerchantProductId) ?? tokens.actionAccent,
          },
    ),
  );

  return segments.map((rows, index) => ({
    color: tokens.actionAccent,
    id: index === 0 ? mode : `${mode}-${index}`,
    label,
    rows,
  }));
}

export function merchantNameByProductId(series: ProductPriceTrendCurrency) {
  return new Map(series.merchants.map(({ merchantProductId, name }) => [merchantProductId, name]));
}

function merchantChartSegments(
  series: ProductPriceTrendCurrency,
  merchantProductId: string,
  label: string,
  color: string,
) {
  const segments = chartRowSegments(series, (point) => {
    const merchantPrice = point.merchantPrices.find(
      (price) => price.merchantProductId === merchantProductId,
    );
    if (!merchantPrice) return [];

    return chartRow(
      `${merchantProductId}-${String(point.observedAt)}`,
      point.observedAt,
      merchantPrice.price,
      series.currency,
      label,
    );
  });

  return segments.map((segmentRows, index) => ({
    color,
    id: index === 0 ? merchantProductId : `${merchantProductId}-${index}`,
    label,
    rows: segmentRows,
  }));
}

function chartRowSegments(
  series: ProductPriceTrendCurrency,
  rowsForPoint: (
    point: ProductPriceTrendCurrency["points"][number],
  ) => PriceSeriesChartSeries["rows"][number][],
) {
  const segments: Array<PriceSeriesChartSeries["rows"][number][]> = [];
  let rows: PriceSeriesChartSeries["rows"][number][] = [];
  let previousDay: number | null = null;

  for (const point of series.points) {
    const day = utcDay(point.observedAt);
    const pointRows = rowsForPoint(point);

    if (pointRows.length === 0 || (previousDay !== null && day !== previousDay + 1)) {
      if (rows.length > 0) segments.push(rows);
      rows = [];
    }

    rows.push(...pointRows);
    previousDay = day;
  }

  if (rows.length > 0) segments.push(rows);
  return segments;
}

function utcDay(value: string) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;

  const date = new Date(timestamp);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86_400_000;
}

function chartRow(
  id: string,
  observedAtValue: string,
  priceValue: string,
  currency: string,
  tooltipLabel: string,
) {
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
      tooltipLabel,
    },
  ];
}
