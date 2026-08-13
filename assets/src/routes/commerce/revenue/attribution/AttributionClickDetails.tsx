import { useId, type ReactNode } from "react";
import { create, props } from "@stylexjs/stylex";
import type { AttributionLedger_row$data } from "$generated/AttributionLedger_row.graphql";
import { TableCell, TableRow } from "$ui/primitives/Table";
import { tokens } from "$ui/theme/tokens.stylex";
import { ConversionDetails } from "./ConversionDetails";

const styles = create({
  row: { backgroundColor: tokens.surfaceMuted },
  cell: { padding: 0 },
  details: {
    display: "grid",
    gap: "1rem",
    gridTemplateColumns: {
      default: "repeat(4, minmax(0, 1fr))",
      "@media (max-width: 80rem)": "repeat(2, minmax(0, 1fr))",
      "@media (max-width: 40rem)": "minmax(0, 1fr)",
    },
    padding: "1rem",
  },
  group: { display: "grid", gap: "0.55rem", minWidth: 0 },
  title: { fontSize: "0.8rem", margin: 0 },
  facts: { display: "grid", gap: "0.35rem", margin: 0 },
  fact: {
    alignItems: "baseline",
    display: "grid",
    gap: "0.5rem",
    gridTemplateColumns: "minmax(5rem, auto) minmax(0, 1fr)",
  },
  label: { color: tokens.textSecondary, fontSize: "0.72rem" },
  value: { fontSize: "0.8rem", margin: 0, overflowWrap: "anywhere" },
  code: { fontFamily: tokens.fontMono, fontSize: "0.76rem" },
  conversionList: { display: "grid", gap: "0.5rem", listStyle: "none", margin: 0, padding: 0 },
  empty: { color: tokens.textSecondary, fontSize: "0.8rem", margin: 0 },
});

type AttributionClick = AttributionLedger_row$data[number];

export function AttributionClickDetails({
  click,
  label,
}: {
  click: AttributionClick;
  label: string;
}) {
  const touchpointId = useId();
  const requestId = useId();
  const commerceId = useId();
  const conversionId = useId();

  return (
    <TableRow style={styles.row}>
      <TableCell colSpan={7} style={styles.cell}>
        <div aria-label={label} role="region" {...props(styles.details)}>
          <DetailGroup id={touchpointId} title="Touchpoint">
            <Fact label="Source" value={sourceSurfaceCopy(click.sourceSurface)} />
            <Fact label="Link type" value={linkTypeCopy(click.linkType)} />
            <Fact label="Referrer" value={referrerCopy(click.referrer)} />
          </DetailGroup>
          <DetailGroup id={requestId} title="Request evidence">
            <Fact code label="User agent" value={userAgentCopy(click.userAgent)} />
            <Fact code label="IP address" value={click.ipAddress ?? "IP not captured"} />
          </DetailGroup>
          <DetailGroup id={commerceId} title="Commerce">
            <Fact label="Merchant" value={click.merchantName} />
            <Fact label="Product" value={click.productName ?? "No product"} />
            <Fact label="Network" value={click.affiliateNetworkName ?? "No network"} />
            <Fact code label="Merchant SKU" value={click.merchantProductExternalSku ?? "No SKU"} />
            <Fact
              code
              label="Program"
              value={click.affiliateProgramCode ?? "No affiliate program"}
            />
          </DetailGroup>
          <section aria-labelledby={conversionId} {...props(styles.group)}>
            <h3 id={conversionId} {...props(styles.title)}>
              Conversion
            </h3>
            {click.matchedConversions.length === 0 ? (
              <p {...props(styles.empty)}>No matched conversions</p>
            ) : (
              <ul aria-label="Matched conversions" {...props(styles.conversionList)}>
                {click.matchedConversions.map((conversion, index) => (
                  <ConversionDetails
                    conversion={conversion}
                    key={`${conversion.affiliateNetworkCode}:${conversion.networkConversionRef}:${index}`}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>
      </TableCell>
    </TableRow>
  );
}

function DetailGroup({ children, id, title }: { children: ReactNode; id: string; title: string }) {
  return (
    <section aria-labelledby={id} {...props(styles.group)}>
      <h3 id={id} {...props(styles.title)}>
        {title}
      </h3>
      <dl {...props(styles.facts)}>{children}</dl>
    </section>
  );
}

function Fact({ code = false, label, value }: { code?: boolean; label: string; value: string }) {
  return (
    <div {...props(styles.fact)}>
      <dt {...props(styles.label)}>{label}</dt>
      <dd {...props(styles.value, code && styles.code)}>{value}</dd>
    </div>
  );
}

export function sourceSurfaceCopy(value: AttributionClick["sourceSurface"]) {
  switch (value) {
    case "API":
      return "Connected tool";
    case "EXTENSION":
      return "Browser extension";
    case "WEB":
      return "Product Compare website";
    default:
      return "Source unavailable";
  }
}

export function linkTypeCopy(value: AttributionClick["linkType"]) {
  switch (value) {
    case "AFFILIATE":
      return "Partner link";
    case "NON_AFFILIATE":
      return "Direct link";
    default:
      return "Link type unavailable";
  }
}

export function referrerCopy(value: AttributionClick["referrer"]) {
  if (!value) return "Not captured";

  try {
    const url = new URL(value);
    return `${url.hostname}${url.pathname === "/" ? "" : ` ${url.pathname}`}`;
  } catch {
    return value;
  }
}

export function userAgentCopy(value: AttributionClick["userAgent"]) {
  return value?.replace(/([A-Za-z])\/(?=\d)/g, "$1 ") ?? "Not captured";
}
