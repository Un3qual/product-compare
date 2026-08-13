import { create, props } from "@stylexjs/stylex";
import { useState } from "react";
import { graphql, useFragment } from "react-relay";
import type {
  CommerceAttributionConfidence,
  CommerceConversionStatus,
  ConversionDetails_conversion$key,
} from "$generated/ConversionDetails_conversion.graphql";
import { formatProductDateTimeLabel } from "$frontend/formatting";
import { StatusBadge } from "$ui/components/status/StatusBadge";
import { Button } from "$ui/primitives/Button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "$ui/primitives/Collapsible";
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
  amount: {
    fontSize: "1rem",
    fontWeight: 750,
    margin: 0,
  },
  code: {
    color: tokens.textSecondary,
    fontFamily: tokens.fontMono,
    fontSize: "0.76rem",
    overflowWrap: "anywhere",
  },
  commerceContext: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.3rem 0.55rem",
  },
  earnings: {
    backgroundColor: tokens.surfaceMuted,
    borderRadius: "var(--pc-radius-medium)",
    display: "grid",
    gap: "0.5rem",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    padding: "0.55rem 0.65rem",
  },
  earning: { display: "grid", gap: "0.1rem", minWidth: 0 },
  investigation: {
    borderBlockStartColor: tokens.borderQuiet,
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: "1px",
    display: "grid",
    gap: "0.55rem",
    marginBlockStart: "0.35rem",
    paddingBlockStart: "0.55rem",
  },
  item: {
    display: "grid",
    gap: "0.35rem",
  },
  label: {
    color: tokens.textSecondary,
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },
  reference: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.25rem 0.6rem",
  },
  summary: { display: "grid", gap: "0.3rem" },
  tags: { alignItems: "center", display: "flex", flexWrap: "wrap", gap: "0.3rem" },
  timeline: {
    display: "grid",
    gap: "0.5rem",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  timelineItem: {
    borderInlineStartColor: tokens.borderEmphasized,
    borderInlineStartStyle: "solid",
    borderInlineStartWidth: "2px",
    display: "grid",
    gap: "0.1rem",
    minWidth: 0,
    paddingInlineStart: "0.5rem",
  },
});

export function ConversionDetails({
  conversion: conversionRef,
}: {
  conversion: ConversionDetails_conversion$key;
}) {
  const conversion = useFragment(conversionFragment, conversionRef);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <li {...props(styles.item)}>
      <div {...props(styles.summary)}>
        <div {...props(styles.tags)}>
          <p {...props(styles.amount)}>
            {formatCurrencyAmount(conversion.orderAmount, conversion.currency)}
          </p>
          <StatusBadge tone={conversionStatusTone(conversion.status)}>
            {conversionStatusCopy(conversion.status)}
          </StatusBadge>
          <StatusBadge tone={attributionConfidenceTone(conversion.attributionConfidence)}>
            {attributionConfidenceCopy(conversion.attributionConfidence)}
          </StatusBadge>
        </div>
      </div>
      <Collapsible onOpenChange={setIsOpen} open={isOpen}>
        <div {...props(styles.reference)}>
          <code title="Conversion reference" {...props(styles.code)}>
            {conversion.networkConversionRef}
          </code>
          <CollapsibleTrigger
            aria-label={`${isOpen ? "Hide" : "Show"} conversion ${conversion.networkConversionRef} details`}
            render={<Button variant="link" />}
          >
            {isOpen ? "Hide details" : "Details"}
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div
            aria-label={`Conversion ${conversion.networkConversionRef} investigation`}
            role="group"
            {...props(styles.investigation)}
          >
            <div {...props(styles.earnings)}>
              <div {...props(styles.earning)}>
                <span {...props(styles.label)}>Order value</span>
                <strong>{formatCurrencyAmount(conversion.orderAmount, conversion.currency)}</strong>
              </div>
              <div {...props(styles.earning)}>
                <span {...props(styles.label)}>Commission</span>
                <strong>
                  {formatCurrencyAmount(conversion.commissionAmount, conversion.currency)}
                </strong>
              </div>
            </div>
            <div {...props(styles.commerceContext)}>
              <strong>{conversion.merchantName ?? "No merchant"}</strong>
              <span>{conversion.productName ?? "No product"}</span>
              <StatusBadge>{conversion.affiliateNetworkName ?? "No affiliate network"}</StatusBadge>
            </div>
            <ol aria-label="Conversion timeline" {...props(styles.timeline)}>
              <li {...props(styles.timelineItem)}>
                <span {...props(styles.label)}>Purchased</span>
                {conversion.purchasedAt ? (
                  <time dateTime={conversion.purchasedAt}>
                    {formatProductDateTimeLabel(conversion.purchasedAt)}
                  </time>
                ) : (
                  <span>Not recorded</span>
                )}
              </li>
              <li {...props(styles.timelineItem)}>
                <span {...props(styles.label)}>Reported</span>
                <time dateTime={conversion.reportedAt}>
                  {formatProductDateTimeLabel(conversion.reportedAt)}
                </time>
              </li>
            </ol>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}

function conversionStatusTone(value: CommerceConversionStatus) {
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

function conversionStatusCopy(value: CommerceConversionStatus) {
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

function attributionConfidenceCopy(value: CommerceAttributionConfidence) {
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

function attributionConfidenceTone(value: CommerceAttributionConfidence) {
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
