import { create, props } from "@stylexjs/stylex";
import { useState } from "react";
import { graphql, useFragment } from "react-relay";
import type {
  CommerceAttributionConfidence,
  CommerceConversionStatus,
  ConversionDetails_conversion$key,
} from "$generated/ConversionDetails_conversion.graphql";
import { formatProductDateTimeLabel } from "$frontend/formatting";
import { Button } from "$ui/primitives/Button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "$ui/primitives/Collapsible";
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
  details: { display: "grid", gap: "0.2rem", margin: 0 },
});

export function ConversionDetails({
  conversion: conversionRef,
}: {
  conversion: ConversionDetails_conversion$key;
}) {
  const conversion = useFragment(conversionFragment, conversionRef);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <li>
      <dl {...props(styles.details)}>
        <dt>Conversion reference</dt>
        <dd>{conversion.networkConversionRef}</dd>
        <dt>Order</dt>
        <dd>Order: {formatCurrencyAmount(conversion.orderAmount, conversion.currency)}</dd>
        <dt>Status</dt>
        <dd>{conversionStatusCopy(conversion.status)}</dd>
        <dt>Attribution</dt>
        <dd>{attributionConfidenceCopy(conversion.attributionConfidence)}</dd>
      </dl>
      <Collapsible onOpenChange={setIsOpen} open={isOpen}>
        <CollapsibleTrigger
          aria-label={`${isOpen ? "Hide" : "Show"} conversion ${conversion.networkConversionRef} details`}
          render={<Button variant="link" />}
        >
          {isOpen ? "Hide conversion details" : "Show conversion details"}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <dl {...props(styles.details)}>
            <dt>Commission</dt>
            <dd>
              Commission: {formatCurrencyAmount(conversion.commissionAmount, conversion.currency)}
            </dd>
            <dt>Conversion merchant</dt>
            <dd>{conversion.merchantName ?? "No merchant"}</dd>
            <dt>Conversion product</dt>
            <dd>{conversion.productName ?? "No product"}</dd>
            <dt>Conversion network</dt>
            <dd>{conversion.affiliateNetworkName ?? "No affiliate network"}</dd>
            <dt>Purchased</dt>
            <dd>
              {conversion.purchasedAt ? (
                <time dateTime={conversion.purchasedAt}>
                  {formatProductDateTimeLabel(conversion.purchasedAt)}
                </time>
              ) : (
                "Not recorded"
              )}
            </dd>
            <dt>Reported</dt>
            <dd>
              <time dateTime={conversion.reportedAt}>
                {formatProductDateTimeLabel(conversion.reportedAt)}
              </time>
            </dd>
          </dl>
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
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
