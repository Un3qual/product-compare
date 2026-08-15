import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import { graphql, useFragment } from "react-relay";
import type {
  HomeProductLedger_products$data,
  HomeProductLedger_products$key,
} from "$generated/HomeProductLedger_products.graphql";
import { RelativeDateTime } from "$ui/components/data";
import { ProductLedger } from "$ui/components/products/ProductLedger";
import { Button } from "$ui/primitives/Button";
import { tokens } from "$ui/theme/tokens.stylex";
import {
  MAX_COMPARE_PRODUCTS,
  buildComparePathFromSlugs,
  buildCurrentRoutePathWithCompareSlugs,
  selectedCompareSlugsAfterAdding,
} from "$routes/compare/paths";
import { homeProductDetailPath } from "./home-paths";

const homeProductLedgerFragment = graphql`
  fragment HomeProductLedger_products on HomeWorkspaceProductsConnection {
    edges {
      node {
        id
        name
        slug
      }
      highlights {
        label
        value
      }
      offer {
        merchantName
        currency
        landedPrice
        priceSignal
        observedAt
      }
    }
  }
`;

const styles = create({
  actions: { display: "flex", flexWrap: "wrap", gap: "0.5rem" },
  detailLink: {
    alignItems: "center",
    color: tokens.actionAccent,
    display: "inline-flex",
    fontSize: "0.86rem",
    fontWeight: 700,
    minHeight: tokens.controlHeight,
    textDecoration: "none",
    textDecorationLine: { ":hover": "underline", default: "none" },
    textUnderlineOffset: "0.2em",
  },
  workspace: { maxWidth: "100%", minWidth: 0 },
});

export function HomeProductLedger({
  products,
  referenceTime,
  selectedSlugs,
}: {
  products: HomeProductLedger_products$key;
  referenceTime: string;
  selectedSlugs: readonly string[];
}) {
  const data = useFragment(homeProductLedgerFragment, products);
  const rows = data.edges.map((edge) => homeLedgerRow(edge, selectedSlugs, referenceTime));

  return (
    <section aria-label="Product workspace" {...props(styles.workspace)}>
      <ProductLedger
        label="Product results"
        rows={rows.map((row) => ({
          actions: <HomeLedgerActions row={row} selectedSlugs={selectedSlugs} />,
          freshness: row.freshness,
          highlights: row.highlights,
          id: row.id,
          offer: row.offer,
          priceSignal: row.priceSignal,
          title: row.name,
        }))}
        secondaryDisclosureLabel="More details"
      />
    </section>
  );
}

function HomeLedgerActions({
  row,
  selectedSlugs,
}: {
  row: ReturnType<typeof homeLedgerRow>;
  selectedSlugs: readonly string[];
}) {
  const isSelected = selectedSlugs.includes(row.slug);
  const isFull = selectedSlugs.length >= MAX_COMPARE_PRODUCTS;
  const compareHref = buildCurrentRoutePathWithCompareSlugs(
    "/",
    "",
    selectedCompareSlugsAfterAdding(selectedSlugs, row.slug, MAX_COMPARE_PRODUCTS),
  );

  return (
    <div {...props(styles.actions)}>
      <Link to={row.href} {...props(styles.detailLink)}>
        View details&nbsp;<span aria-hidden="true">→</span>
      </Link>
      {isSelected ? (
        <Button render={<Link to={buildComparePathFromSlugs(selectedSlugs)} />} size="sm">
          Open comparison
        </Button>
      ) : isFull ? (
        <Link to={buildComparePathFromSlugs(selectedSlugs)} {...props(styles.detailLink)}>
          Comparison is full&nbsp;<span aria-hidden="true">→</span>
        </Link>
      ) : (
        <Button render={<Link to={compareHref} />} size="sm">
          Add to comparison
        </Button>
      )}
    </div>
  );
}

function homeLedgerRow(
  { highlights, node: product, offer }: HomeProductLedger_products$data["edges"][number],
  selectedSlugs: readonly string[],
  referenceTime: string,
) {
  return {
    freshness: priceObservationFreshness(offer.observedAt, referenceTime),
    highlights: formatHighlights(highlights),
    href: homeProductDetailPath(product.slug, selectedSlugs),
    id: product.id,
    name: product.name,
    offer: formatOffer(offer),
    priceSignal: priceSignalCopy(offer.priceSignal),
    slug: product.slug,
  };
}

function priceObservationFreshness(observedAt: string | null, referenceTime: string) {
  if (!observedAt || Number.isNaN(Date.parse(observedAt))) {
    return "Last checked unavailable";
  }

  return <RelativeDateTime prefix="Last checked" referenceTime={referenceTime} value={observedAt} />;
}

function formatHighlights(highlights: ReadonlyArray<{ label: string; value: string }>) {
  const labels = highlights
    .filter(({ label, value }) => label.trim().length > 0 && value.trim().length > 0)
    .slice(0, 3)
    .map(({ label, value }) => `${label}: ${value}`);

  return labels.length > 0 ? labels.join(" · ") : "Details available on the product page";
}

function formatOffer(offer: { currency: string; landedPrice: string; merchantName: string }) {
  return `${formatCurrency(offer.landedPrice, offer.currency)} at ${offer.merchantName}`;
}

function formatCurrency(value: string, currency: string) {
  const match = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(value.trim());

  if (!match) return value;

  try {
    const [, sign, whole = "0", rawFraction = ""] = match;
    const fraction = rawFraction.padEnd(3, "0");
    let minorUnits = BigInt(whole) * 100n + BigInt(fraction.slice(0, 2));

    if (fraction[2] >= "5") minorUnits += 1n;

    const formatted = new Intl.NumberFormat("en-US", {
      currency,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
      style: "currency",
    })
      .formatToParts(minorUnits / 100n)
      .map((part) =>
        part.type === "fraction" ? (minorUnits % 100n).toString().padStart(2, "0") : part.value,
      )
      .join("");

    return sign === "-" && minorUnits !== 0n ? `-${formatted}` : formatted;
  } catch {
    return `${value} ${currency}`;
  }
}

function priceSignalCopy(code: string) {
  switch (code) {
    case "BELOW_30_DAY_MEDIAN":
      return "Below the 30-day price";
    case "AT_OR_ABOVE_30_DAY_MEDIAN":
      return "At or above the 30-day price";
    default:
      return "No 30-day price history";
  }
}
