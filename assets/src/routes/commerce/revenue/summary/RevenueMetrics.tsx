import { useId, type ReactNode } from "react";
import { create, props } from "@stylexjs/stylex";
import { tokens } from "$ui/theme/tokens.stylex";
import type { buildRevenueDashboardMetrics } from "./revenue-summary-data";

const styles = create({
  summaryModules: {
    display: "grid",
    gap: "1rem",
    gridArea: "summary",
    gridTemplateColumns: {
      default: "repeat(2, minmax(0, 1fr))",
      "@media (max-width: 48rem)": "minmax(0, 1fr)",
    },
    minWidth: 0,
  },
  module: {
    borderColor: tokens.borderQuiet,
    borderRadius: "var(--pc-radius-large)",
    borderStyle: "solid",
    borderWidth: "1px",
    display: "grid",
    gap: "1.1rem",
    minWidth: 0,
    padding: "1rem",
  },
  title: {
    fontSize: "0.9rem",
    margin: 0,
  },
  metricRow: {
    display: "grid",
    gap: "0.75rem",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    margin: 0,
  },
  metric: {
    borderInlineStartColor: tokens.borderQuiet,
    borderInlineStartStyle: "solid",
    borderInlineStartWidth: "1px",
    display: "grid",
    gap: "0.3rem",
    minWidth: 0,
    paddingInlineStart: "0.75rem",
  },
  label: {
    color: tokens.textSecondary,
    fontSize: "0.75rem",
    lineHeight: 1.35,
  },
  value: {
    fontSize: "1.05rem",
    fontWeight: 750,
    lineHeight: 1.2,
    margin: 0,
    overflowWrap: "anywhere",
  },
});

export function RevenueMetrics({
  metrics,
}: {
  metrics: ReturnType<typeof buildRevenueDashboardMetrics>;
}) {
  const performanceId = useId();
  const outcomeId = useId();

  return (
    <div {...props(styles.summaryModules)}>
      <section aria-labelledby={performanceId} {...props(styles.module)}>
        <h2 id={performanceId} {...props(styles.title)}>
          Attribution performance
        </h2>
        <dl {...props(styles.metricRow)}>
          <Metric label="Clicks" value={metrics.attribution.clicks} />
          <Metric label="Conversions" value={metrics.attribution.conversions} />
          <Metric label="Conversion rate" value={metrics.attribution.conversionRate} />
        </dl>
      </section>
      <section aria-labelledby={outcomeId} {...props(styles.module)}>
        <h2 id={outcomeId} {...props(styles.title)}>
          Revenue outcome
        </h2>
        <dl {...props(styles.metricRow)}>
          {metrics.revenue.map((metric) => (
            <Metric key={metric.label} label={metric.label} value={metric.value} />
          ))}
        </dl>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div {...props(styles.metric)}>
      <dt {...props(styles.label)}>{label}</dt>
      <dd {...props(styles.value)}>{value}</dd>
    </div>
  );
}
