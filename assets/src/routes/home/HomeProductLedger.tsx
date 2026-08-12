import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import { graphql, useFragment } from "react-relay";
import type { HomeProductLedger_products$key } from "$generated/HomeProductLedger_products.graphql";
import { ProductLedger } from "$ui/components/products/ProductLedger";
import { Button } from "$ui/primitives/Button";
import { tokens } from "$ui/theme/tokens.stylex";
import {
  MAX_COMPARE_PRODUCTS,
  buildComparePathFromSlugs,
  buildCurrentRoutePathWithCompareSlugs,
  selectedCompareSlugsAfterAdding,
} from "$routes/compare/paths";
import { homeLedgerRows, type HomeLedgerRow } from "./home-view-data";

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
  secondaryDetails: { display: "grid", gap: "0.5rem", margin: 0 },
  secondaryDetail: {
    display: "grid",
    gap: "0.35rem",
    gridTemplateColumns: "6.5rem minmax(0, 1fr)",
  },
  secondaryDetailLabel: {
    color: tokens.textSecondary,
    fontFamily: tokens.fontMono,
    fontSize: "0.7rem",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },
  secondaryDetailValue: { margin: 0 },
  workspace: { maxWidth: "100%", minWidth: 0 },
});

export function HomeProductLedger({
  products,
  selectedSlugs,
}: {
  products: HomeProductLedger_products$key;
  selectedSlugs: readonly string[];
}) {
  const data = useFragment(homeProductLedgerFragment, products);
  const rows = homeLedgerRows(data, selectedSlugs);

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
          secondaryDetails: <HomeLedgerDetails row={row} />,
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
  row: HomeLedgerRow;
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
      <Button render={<Link to={row.href} />} size="sm" variant="secondary">
        View details
      </Button>
      {isSelected ? (
        <Button render={<Link to={buildComparePathFromSlugs(selectedSlugs)} />} size="sm">
          Open comparison
        </Button>
      ) : isFull ? (
        <Button
          render={<Link to={buildComparePathFromSlugs(selectedSlugs)} />}
          size="sm"
          variant="ghost"
        >
          Comparison is full
        </Button>
      ) : (
        <Button render={<Link to={compareHref} />} size="sm" variant="ghost">
          Add to comparison
        </Button>
      )}
    </div>
  );
}

function HomeLedgerDetails({ row }: { row: HomeLedgerRow }) {
  return (
    <dl {...props(styles.secondaryDetails)}>
      <div {...props(styles.secondaryDetail)}>
        <dt {...props(styles.secondaryDetailLabel)}>Price context</dt>
        <dd {...props(styles.secondaryDetailValue)}>{row.priceSignal}</dd>
      </div>
      <div {...props(styles.secondaryDetail)}>
        <dt {...props(styles.secondaryDetailLabel)}>Checked</dt>
        <dd {...props(styles.secondaryDetailValue)}>{row.freshness}</dd>
      </div>
    </dl>
  );
}
