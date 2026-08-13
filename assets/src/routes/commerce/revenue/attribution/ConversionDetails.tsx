import { create, props } from "@stylexjs/stylex";
import { graphql, useFragment } from "react-relay";
import type {
  CommerceAttributionConfidence,
  CommerceConversionStatus,
  ConversionDetails_conversion$key,
} from "$generated/ConversionDetails_conversion.graphql";
import { formatProductDateTimeLabel } from "$frontend/formatting";
import { StatusBadge } from "$ui/components/status/StatusBadge";
import { tokens } from "$ui/theme/tokens.stylex";
import { formatCurrencyAmount } from "../summary/revenue-summary-data";

const conversionFragment = graphql`
  fragment ConversionDetails_conversion on CommerceAttributionMatchedConversion {
    affiliateNetworkName
    attributionConfidence
    commissionAmount
    currency
    merchantName
    networkConversionRef
    orderAmount
    productName
    purchasedAt
    reportedAt
    status
  }
`;

const styles = create({
  code: {
    color: tokens.textSecondary,
    fontFamily: tokens.fontMono,
    fontSize: "0.76rem",
    overflowWrap: "anywhere",
  },
  conversion: {
    display: "grid",
    gap: "0.3rem",
  },
  diagnosticLine: {
    alignItems: "baseline",
    color: tokens.textSecondary,
    display: "flex",
    fontSize: "0.78rem",
    flexWrap: "wrap",
    gap: "0.15rem 0.4rem",
  },
  item: {
    borderBlockEndColor: tokens.borderQuiet,
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: {
      ":last-child": 0,
      default: "1px",
    },
    paddingBlockEnd: {
      ":last-child": 0,
      default: "0.4rem",
    },
  },
  label: {
    color: tokens.textSecondary,
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },
  labeledFact: {
    alignItems: "baseline",
    display: "inline-flex",
    gap: "0.2rem",
  },
  primaryLine: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.2rem 0.4rem",
  },
  supportingLine: {
    alignItems: "baseline",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.15rem 0.4rem",
  },
});

export function ConversionDetails({
  conversion: conversionRef,
}: {
  conversion: ConversionDetails_conversion$key;
}) {
  const conversion = useFragment(conversionFragment, conversionRef);

  return (
    <li {...props(styles.item)}>
      <div
        aria-label={`Conversion ${conversion.networkConversionRef}`}
        role="group"
        {...props(styles.conversion)}
      >
        <div {...props(styles.primaryLine)}>
          <span {...props(styles.labeledFact)}>
            <span {...props(styles.label)}>Order value</span>
            <strong>{formatCurrencyAmount(conversion.orderAmount, conversion.currency)}</strong>
          </span>
          <StatusBadge tone={conversionStatusTone(conversion.status)}>
            {conversionStatusCopy(conversion.status)}
          </StatusBadge>
          <span {...props(styles.labeledFact)}>
            <span {...props(styles.label)}>Commission</span>
            <strong>
              {formatCurrencyAmount(conversion.commissionAmount, conversion.currency)}
            </strong>
          </span>
          <StatusBadge tone={attributionConfidenceTone(conversion.attributionConfidence)}>
            {attributionConfidenceCopy(conversion.attributionConfidence)}
          </StatusBadge>
        </div>
        <div {...props(styles.supportingLine)}>
          <strong>{conversion.merchantName ?? "No merchant"}</strong>
          <span aria-hidden="true">·</span>
          <span>{conversion.productName ?? "No product"}</span>
          <span aria-hidden="true">·</span>
          <span>{conversion.affiliateNetworkName ?? "No affiliate network"}</span>
        </div>
        <div {...props(styles.diagnosticLine)}>
          <span>
            <span {...props(styles.label)}>Purchased</span>{" "}
            {conversion.purchasedAt ? (
              <time dateTime={conversion.purchasedAt}>
                {formatProductDateTimeLabel(conversion.purchasedAt)}
              </time>
            ) : (
              "Not recorded"
            )}
          </span>
          <span aria-hidden="true">→</span>
          <span>
            <span {...props(styles.label)}>Reported</span>{" "}
            <time dateTime={conversion.reportedAt}>
              {formatProductDateTimeLabel(conversion.reportedAt)}
            </time>
          </span>
          <code title="Conversion reference" {...props(styles.code)}>
            {conversion.networkConversionRef}
          </code>
        </div>
      </div>
    </li>
  );
}

export function conversionStatusTone(value: CommerceConversionStatus) {
  switch (value) {
    case "APPROVED":
    case "PAID":
      return "positive";
    case "PENDING":
      return "warning";
    case "REVERSED":
      return "danger";
    default:
      return "neutral";
  }
}

export function conversionStatusCopy(value: CommerceConversionStatus) {
  switch (value) {
    case "APPROVED":
      return "Approved";
    case "PAID":
      return "Paid";
    case "PENDING":
      return "Awaiting confirmation";
    case "REVERSED":
      return "Reversed";
    default:
      return "Status unavailable";
  }
}

export function attributionConfidenceCopy(value: CommerceAttributionConfidence) {
  switch (value) {
    case "HIGH":
      return "Strong match";
    case "LOW":
      return "Possible match";
    case "UNMATCHED":
      return "Not matched";
    default:
      return "Match unavailable";
  }
}

export function attributionConfidenceTone(value: CommerceAttributionConfidence) {
  switch (value) {
    case "HIGH":
      return "positive";
    case "LOW":
      return "warning";
    case "UNMATCHED":
      return "neutral";
    default:
      return "neutral";
  }
}
