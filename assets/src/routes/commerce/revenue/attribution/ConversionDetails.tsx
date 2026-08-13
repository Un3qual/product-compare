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
    fontSize: "1.05rem",
    fontWeight: 750,
    margin: 0,
  },
  code: {
    color: tokens.textSecondary,
    fontFamily: tokens.fontMono,
    fontSize: "0.76rem",
    overflowWrap: "anywhere",
  },
  detail: {
    color: tokens.textSecondary,
    lineHeight: 1.45,
    margin: 0,
  },
  detailPanel: {
    borderBlockStartColor: tokens.borderQuiet,
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: "1px",
    display: "grid",
    gap: "0.6rem",
    marginBlockStart: "0.5rem",
    paddingBlockStart: "0.75rem",
  },
  item: {
    backgroundColor: tokens.surfaceRaised,
    borderRadius: "var(--pc-radius-large)",
    display: "grid",
    gap: "0.75rem",
    padding: "0.75rem",
  },
  summary: { display: "grid", gap: "0.5rem" },
  tags: { display: "flex", flexWrap: "wrap", gap: "0.35rem" },
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
        <p {...props(styles.amount)}>
          {formatCurrencyAmount(conversion.orderAmount, conversion.currency)}
        </p>
        <div {...props(styles.tags)}>
          <StatusBadge tone={conversionStatusTone(conversion.status)}>
            {conversionStatusCopy(conversion.status)}
          </StatusBadge>
          <StatusBadge tone={attributionConfidenceTone(conversion.attributionConfidence)}>
            {attributionConfidenceCopy(conversion.attributionConfidence)}
          </StatusBadge>
        </div>
        <code title="Conversion reference" {...props(styles.code)}>
          {conversion.networkConversionRef}
        </code>
      </div>
      <Collapsible onOpenChange={setIsOpen} open={isOpen}>
        <CollapsibleTrigger
          aria-label={`${isOpen ? "Hide" : "Show"} conversion ${conversion.networkConversionRef} details`}
          render={<Button variant="link" />}
        >
          {isOpen ? "Hide conversion details" : "Show conversion details"}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div {...props(styles.detailPanel)}>
            <p {...props(styles.detail)}>
              <strong>
                {formatCurrencyAmount(conversion.commissionAmount, conversion.currency)} commission
              </strong>
            </p>
            <p {...props(styles.detail)}>
              <span>{conversion.merchantName ?? "No merchant"}</span>
              {" · "}
              <span>{conversion.productName ?? "No product"}</span>
              {" · "}
              <span>{conversion.affiliateNetworkName ?? "No affiliate network"}</span>
            </p>
            <p {...props(styles.detail)}>
              Purchased{" "}
              {conversion.purchasedAt ? (
                <time dateTime={conversion.purchasedAt}>
                  {formatProductDateTimeLabel(conversion.purchasedAt)}
                </time>
              ) : (
                "not recorded"
              )}
              {" · Reported "}
              <time dateTime={conversion.reportedAt}>
                {formatProductDateTimeLabel(conversion.reportedAt)}
              </time>
            </p>
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
