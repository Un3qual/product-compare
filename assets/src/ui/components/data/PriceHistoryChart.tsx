import { useMemo } from "react";
import { dot } from "@tanstack/charts/dot";
import { lineY } from "@tanstack/charts/line";
import { Chart } from "@tanstack/charts/react";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { defineChart } from "@tanstack/charts/scene";
import { tooltip } from "@tanstack/charts/tooltip";
import { create, props } from "@stylexjs/stylex";
import { tokens } from "$ui/theme/tokens.stylex";

export type PriceHistoryChartDatum = {
  id: string;
  observedAt: string;
  observedDate: string;
  priceText: string;
  priceValue: number;
};

type PriceHistoryChartPoint = PriceHistoryChartDatum & {
  observedTimestamp: number;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const priceFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const styles = create({
  root: {
    display: "grid",
    gap: "0.35rem",
    margin: 0,
    minWidth: 0,
  },
  chart: {
    color: tokens.textSecondary,
    minWidth: 0,
    width: "100%",
  },
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

export function PriceHistoryChart({
  label,
  rows,
}: {
  label: string;
  rows: ReadonlyArray<PriceHistoryChartDatum>;
}) {
  const points = useMemo(() => prepareChartPoints(rows), [rows]);
  const definition = useMemo(() => {
    const observedTimestampTicks = chartTimestampTicks(points);
    const observedDatesByTimestamp = new Map(
      points.map((point) => [point.observedTimestamp, point.observedDate]),
    );

    return defineChart({
      focus: "group-x",
      marks: [
        lineY(points, {
          id: "price-history-line",
          key: "id",
          points: false,
          stroke: tokens.actionAccent,
          strokeWidth: 2,
          x: "observedTimestamp",
          y: "priceValue",
        }),
        dot(points, {
          fill: tokens.surfaceRaised,
          id: "price-history-points",
          key: "id",
          r: 4,
          stroke: tokens.actionAccent,
          strokeWidth: 2,
          x: "observedTimestamp",
          y: "priceValue",
        }),
      ],
      svgAnimation: false,
      theme: {
        background: "transparent",
        foreground: tokens.textSecondary,
        grid: tokens.borderQuiet,
        muted: tokens.textSubtle,
        palette: [tokens.actionAccent],
      },
      tooltip: {
        use: tooltip,
        items: [
          {
            channel: "y",
            label: "Price",
            text: (point) => point.datum.priceText,
          },
          {
            channel: "x",
            label: "Observed",
            text: (point) => point.datum.observedDate,
          },
        ],
        sticky: true,
      },
      x: {
        axis: {
          tickLabels: {
            anchor: ({ value }) => timestampTickAnchor(value, observedTimestampTicks),
          },
          ticks: {
            format: (value) =>
              formatObservedDate(observedDatesByTimestamp.get(value)) ||
              formatObservedTimestamp(value),
            values: observedTimestampTicks,
          },
        },
        scale: scaleLinear,
      },
      y: {
        axis: {
          tickLabels: { thin: true },
          ticks: {
            count: 3,
            format: (value) => priceFormatter.format(value),
          },
        },
        grid: true,
        nice: true,
        scale: scaleLinear,
      },
    });
  }, [points]);

  return (
    <figure data-slot="price-history-chart" {...props(styles.root)}>
      <div {...props(styles.chart)}>
        <Chart
          ariaDescription={`${points.length} price observations shown from oldest to newest.`}
          ariaLabel={`${label} chart`}
          definition={definition}
          height={152}
          initialWidth={360}
        />
      </div>
      <table aria-label={`${label} data`} {...props(styles.visuallyHidden)}>
        <thead>
          <tr>
            <th scope="col">Observed</th>
            <th scope="col">Price</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.id}>
              <td>
                <time dateTime={point.observedAt}>{point.observedDate}</time>
              </td>
              <td>{point.priceText}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function prepareChartPoints(rows: ReadonlyArray<PriceHistoryChartDatum>): PriceHistoryChartPoint[] {
  return rows
    .flatMap((row) => {
      const observedTimestamp = Date.parse(row.observedAt);

      return Number.isFinite(observedTimestamp) && Number.isFinite(row.priceValue)
        ? [{ ...row, observedTimestamp }]
        : [];
    })
    .sort((left, right) => left.observedTimestamp - right.observedTimestamp);
}

function formatObservedTimestamp(value: number) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? dateFormatter.format(date) : "";
}

function formatObservedDate(value: string | undefined) {
  return value ? formatObservedTimestamp(Date.parse(`${value}T00:00:00Z`)) : "";
}

function chartTimestampTicks(points: ReadonlyArray<PriceHistoryChartPoint>) {
  if (points.length <= 3) {
    return points.map((point) => point.observedTimestamp);
  }

  return [
    points[0].observedTimestamp,
    points[Math.floor((points.length - 1) / 2)].observedTimestamp,
    points.at(-1)?.observedTimestamp ?? points[0].observedTimestamp,
  ];
}

function timestampTickAnchor(value: number, ticks: ReadonlyArray<number>) {
  if (ticks.length <= 1) {
    return "middle" as const;
  }

  if (value === ticks[0]) {
    return "start" as const;
  }

  return value === ticks.at(-1) ? ("end" as const) : ("middle" as const);
}
