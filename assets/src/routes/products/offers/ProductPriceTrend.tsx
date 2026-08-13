import { useId, useMemo, useState } from "react";
import { create, props } from "@stylexjs/stylex";
import { Button } from "$ui/primitives/Button";
import { tokens } from "$ui/theme/tokens.stylex";
import { PriceSeriesChart } from "$ui/components/data/PriceHistoryChart";
import {
  initialTrendCurrency,
  merchantNameByProductId,
  productPriceChartSeries,
  type ProductPriceTrendCurrency,
  type ProductPriceTrendMode,
} from "./product-price-trend";

const styles = create({
  root: {
    borderBlockEndColor: tokens.borderQuiet,
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "1px",
    display: "grid",
    gap: "1rem",
    marginBlockEnd: "1.25rem",
    paddingBlockEnd: "1.25rem",
  },
  header: {
    alignItems: "end",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem 1.5rem",
    justifyContent: "space-between",
  },
  heading: { fontSize: "1.2rem", letterSpacing: "-0.02em", margin: 0 },
  description: { color: tokens.textSecondary, margin: 0 },
  controls: { alignItems: "end", display: "flex", flexWrap: "wrap", gap: "0.65rem" },
  modes: { display: "flex", flexWrap: "wrap", gap: "0.35rem" },
  currencyLabel: {
    color: tokens.textSecondary,
    display: "grid",
    fontSize: "0.75rem",
    fontWeight: 700,
    gap: "0.25rem",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },
  currencySelect: {
    backgroundColor: tokens.surfaceRaised,
    borderColor: tokens.border,
    borderRadius: "var(--pc-radius-medium)",
    borderStyle: "solid",
    borderWidth: "1px",
    color: tokens.text,
    font: "inherit",
    minHeight: tokens.controlHeight,
    paddingInline: "0.65rem",
  },
  legend: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.4rem 1rem",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  legendItem: {
    alignItems: "center",
    color: tokens.textSecondary,
    display: "inline-flex",
    fontSize: "0.82rem",
    gap: "0.35rem",
  },
  swatch: { borderRadius: "999px", height: "0.55rem", width: "0.55rem" },
  visuallyHidden: {
    borderWidth: 0,
    clip: "rect(0 0 0 0)",
    height: "1px",
    margin: "-1px",
    overflow: "hidden",
    padding: 0,
    position: "absolute",
    whiteSpace: "nowrap",
    width: "1px",
  },
});

const modes: ReadonlyArray<{ label: string; value: ProductPriceTrendMode }> = [
  { label: "Lowest", value: "lowest" },
  { label: "Average", value: "average" },
  { label: "By merchant", value: "merchants" },
];

export function ProductPriceTrend({ series }: { series: readonly ProductPriceTrendCurrency[] }) {
  const titleId = useId();
  const [currency, setCurrency] = useState(() => initialTrendCurrency(series));
  const [mode, setMode] = useState<ProductPriceTrendMode>("lowest");
  const selectedSeries = series.find((item) => item.currency === currency) ?? series[0];
  const chartSeries = useMemo(
    () => (selectedSeries ? productPriceChartSeries(selectedSeries, mode) : []),
    [mode, selectedSeries],
  );

  return (
    <section aria-labelledby={titleId} {...props(styles.root)}>
      <div {...props(styles.header)}>
        <div>
          <h3 id={titleId} {...props(styles.heading)}>
            Price trend
          </h3>
          <p {...props(styles.description)}>Daily prices across active merchants for 90 days.</p>
        </div>
        {selectedSeries ? (
          <div {...props(styles.controls)}>
            <div aria-label="Price trend view" {...props(styles.modes)}>
              {modes.map((item) => (
                <Button
                  aria-pressed={mode === item.value}
                  key={item.value}
                  onClick={() => setMode(item.value)}
                  size="sm"
                  variant={mode === item.value ? "secondary" : "ghost"}
                >
                  {item.label}
                </Button>
              ))}
            </div>
            {series.length > 1 ? (
              <label {...props(styles.currencyLabel)}>
                Currency
                <select
                  onChange={(event) => setCurrency(event.currentTarget.value)}
                  value={selectedSeries.currency}
                  {...props(styles.currencySelect)}
                >
                  {series.map((item) => (
                    <option key={item.currency} value={item.currency}>
                      {item.currency}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
        ) : null}
      </div>

      {selectedSeries ? (
        <>
          <MerchantLegend chartSeries={chartSeries} mode={mode} selectedSeries={selectedSeries} />
          <PriceSeriesChart
            label={`${modeLabel(mode)} ${selectedSeries.currency} price trend`}
            series={chartSeries}
          />
          <PriceTrendDataTable mode={mode} series={selectedSeries} />
        </>
      ) : (
        <p {...props(styles.description)}>Price history is not available yet.</p>
      )}
    </section>
  );
}

function MerchantLegend({
  chartSeries,
  mode,
  selectedSeries,
}: {
  chartSeries: ReturnType<typeof productPriceChartSeries>;
  mode: ProductPriceTrendMode;
  selectedSeries: ProductPriceTrendCurrency;
}) {
  const colors = new Map(
    productPriceChartSeries(selectedSeries, "merchants").map(({ color, id }) => [id, color]),
  );
  const items =
    mode === "average"
      ? chartSeries
      : selectedSeries.merchants.map((merchant) => ({
          color: colors.get(merchant.merchantProductId) ?? tokens.actionAccent,
          id: merchant.merchantProductId,
          label: merchant.name,
        }));

  return (
    <ul aria-label="Price trend legend" {...props(styles.legend)}>
      {items.map((item) => (
        <li key={item.id} {...props(styles.legendItem)}>
          <span aria-hidden style={{ backgroundColor: item.color }} {...props(styles.swatch)} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

function PriceTrendDataTable({
  mode,
  series,
}: {
  mode: ProductPriceTrendMode;
  series: ProductPriceTrendCurrency;
}) {
  const merchantNames = merchantNameByProductId(series);

  return (
    <div {...props(styles.visuallyHidden)}>
      <table aria-label={`${tableModeLabel(mode)} ${series.currency} price trend data`}>
        <thead>
          <tr>
            <th scope="col">Observed</th>
            {mode === "merchants" ? (
              series.merchants.map((merchant) => <th key={merchant.id}>{merchant.name}</th>)
            ) : (
              <>
                <th scope="col">{mode === "average" ? "Average price" : "Lowest price"}</th>
                {mode === "lowest" ? <th scope="col">Merchant</th> : null}
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {series.points.map((point) => (
            <tr key={String(point.observedAt)}>
              <td>
                <time dateTime={String(point.observedAt)}>{String(point.observedAt)}</time>
              </td>
              {mode === "merchants" ? (
                series.merchants.map((merchant) => (
                  <td key={merchant.id}>
                    {String(
                      point.merchantPrices.find(
                        ({ merchantProductId }) => merchantProductId === merchant.merchantProductId,
                      )?.price ?? "—",
                    )}
                  </td>
                ))
              ) : (
                <>
                  <td>{String(mode === "average" ? point.averagePrice : point.lowestPrice)}</td>
                  {mode === "lowest" ? (
                    <td>
                      {merchantNames.get(point.lowestMerchantProductId) ?? "Unknown merchant"}
                    </td>
                  ) : null}
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function modeLabel(mode: ProductPriceTrendMode) {
  if (mode === "merchants") return "Merchant";
  return mode === "average" ? "Average" : "Lowest";
}

function tableModeLabel(mode: ProductPriceTrendMode) {
  return mode === "merchants" ? "Merchant" : modeLabel(mode);
}
