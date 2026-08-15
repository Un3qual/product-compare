import { useId } from "react";
import { create, props } from "@stylexjs/stylex";
import type { AttributionLedger_row$data } from "$generated/AttributionLedger_row.graphql";
import { formatProductDateTimeLabel } from "$frontend/formatting";
import { StatusBadge } from "$ui/components/status/StatusBadge";
import { tokens } from "$ui/theme/tokens.stylex";
import { formatCurrencyAmount } from "../summary/revenue-summary-data";
import {
  attributionConfidenceCopy,
  attributionConfidenceTone,
  conversionStatusCopy,
  conversionStatusTone,
} from "./ConversionDetails";

const styles = create({
  root: {
    borderColor: tokens.borderQuiet,
    borderRadius: "var(--pc-radius-large)",
    borderStyle: "solid",
    borderWidth: "1px",
    display: "grid",
    gap: "0.8rem",
    gridArea: "recent",
    minWidth: 0,
    padding: "1rem",
  },
  header: {
    alignItems: "baseline",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.35rem 0.75rem",
    justifyContent: "space-between",
  },
  title: { fontSize: "0.9rem", margin: 0 },
  scope: { color: tokens.textSecondary, fontSize: "0.75rem", margin: 0 },
  badges: { display: "flex", flexWrap: "wrap", gap: "0.35rem" },
  identity: { display: "grid", gap: "0.15rem" },
  merchant: { fontSize: "0.95rem", margin: 0 },
  product: { color: tokens.textSecondary, margin: 0 },
  metrics: {
    borderBlockStartColor: tokens.borderQuiet,
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: "1px",
    display: "grid",
    gap: "0.75rem",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    margin: 0,
    paddingBlockStart: "0.75rem",
  },
  metric: { display: "grid", gap: "0.15rem" },
  label: { color: tokens.textSecondary, fontSize: "0.72rem" },
  value: { fontWeight: 750, margin: 0, overflowWrap: "anywhere" },
  reported: { color: tokens.textSecondary, fontSize: "0.78rem", margin: 0 },
  empty: { color: tokens.textSecondary, margin: 0 },
});

type AttributionClick = AttributionLedger_row$data[number];

export function RecentConversion({ clicks }: { clicks: readonly AttributionClick[] }) {
  const headingId = useId();
  const conversion = recentLoadedConversion(clicks);

  return (
    <section aria-labelledby={headingId} {...props(styles.root)}>
      <header {...props(styles.header)}>
        <h2 id={headingId} {...props(styles.title)}>
          Recent conversion
        </h2>
        <p {...props(styles.scope)}>Latest in loaded activity</p>
      </header>
      {conversion ? (
        <>
          <div {...props(styles.badges)}>
            <StatusBadge tone={conversionStatusTone(conversion.status)}>
              {conversionStatusCopy(conversion.status)}
            </StatusBadge>
            <StatusBadge tone={attributionConfidenceTone(conversion.attributionConfidence)}>
              {attributionConfidenceCopy(conversion.attributionConfidence)}
            </StatusBadge>
          </div>
          <div {...props(styles.identity)}>
            <strong {...props(styles.merchant)}>{conversion.merchantName ?? "No merchant"}</strong>
            <p {...props(styles.product)}>{conversion.productName ?? "No product"}</p>
          </div>
          <dl {...props(styles.metrics)}>
            <Metric
              label="Order"
              value={formatCurrencyAmount(conversion.orderAmount, conversion.currency)}
            />
            <Metric
              label="Commission"
              value={formatCurrencyAmount(conversion.commissionAmount, conversion.currency)}
            />
          </dl>
          <p {...props(styles.reported)}>
            Reported {" "}
            <time dateTime={conversion.reportedAt}>
              {formatProductDateTimeLabel(conversion.reportedAt)}
            </time>
          </p>
        </>
      ) : (
        <p {...props(styles.empty)}>No matched conversion in loaded activity</p>
      )}
    </section>
  );
}

function recentLoadedConversion(clicks: readonly AttributionClick[]) {
  let recent: AttributionClick["matchedConversions"][number] | null = null;

  for (const click of clicks) {
    for (const conversion of click.matchedConversions) {
      if (recent === null || conversion.reportedAt > recent.reportedAt) {
        recent = conversion;
      }
    }
  }

  return recent;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div {...props(styles.metric)}>
      <dt {...props(styles.label)}>{label}</dt>
      <dd {...props(styles.value)}>{value}</dd>
    </div>
  );
}
