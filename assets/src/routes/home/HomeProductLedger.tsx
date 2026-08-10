import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import { Button } from "../../ui/primitives/Button";
import { ProductLedger } from "../../ui/components/products/ProductLedger";
import { tokens } from "../../ui/theme/tokens.stylex";
import {
  MAX_COMPARE_PRODUCTS,
  buildComparePathFromSlugs,
  buildCurrentRoutePathWithCompareSlugs,
  selectedCompareSlugsAfterAdding,
} from "../compare/paths";

const styles = create({
  headings: {
    color: tokens.textSecondary,
    display: "grid",
    fontFamily: tokens.fontMono,
    fontSize: "0.7rem",
    gap: "1rem",
    gridTemplateColumns: {
      default:
        "minmax(13rem, 1.35fr) minmax(10rem, 1fr) minmax(10rem, 1fr) minmax(9rem, 0.8fr) minmax(8rem, 0.7fr) auto",
      "@media (max-width: 62rem)":
        "minmax(13rem, 1.3fr) minmax(10rem, 1fr) minmax(9rem, 0.8fr) auto",
      "@media (max-width: 42rem)": "minmax(0, 1fr)",
    },
    letterSpacing: "0.04em",
    padding: "0.6rem 0",
    textTransform: "uppercase",
  },
  desktopOnly: {
    display: {
      default: "block",
      "@media (max-width: 62rem)": "none",
    },
  },
  tabletOnly: {
    display: {
      default: "block",
      "@media (max-width: 42rem)": "none",
    },
  },
  actions: { display: "flex", flexWrap: "wrap", gap: "0.5rem" },
  secondaryDetails: { display: "grid", gap: "0.25rem" },
});

export type HomeLedgerRow = {
  category: string;
  freshness: string;
  highlights: string;
  href: string;
  id: string;
  name: string;
  offer: string;
  priceSignal: string;
  slug: string;
};

export function HomeProductLedger({
  rows,
  selectedSlugs,
}: {
  rows: readonly HomeLedgerRow[];
  selectedSlugs: readonly string[];
}) {
  return (
    <section aria-label="Product workspace">
      <div aria-hidden="true" data-slot="home-ledger-headings" {...props(styles.headings)}>
        <span>Product</span>
        <span {...props(styles.tabletOnly)}>
          Highlights
        </span>
        <span>Best offer</span>
        <span {...props(styles.desktopOnly)}>
          Price signal
        </span>
        <span {...props(styles.desktopOnly)}>
          Last checked
        </span>
        <span>Actions</span>
      </div>
      <ProductLedger
        label="Product results"
        rows={rows.map((row) => ({
          actions: <HomeLedgerActions row={row} selectedSlugs={selectedSlugs} />,
          category: row.category,
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
      <Button asChild size="1" variant="soft">
        <Link to={row.href}>View details</Link>
      </Button>
      {isSelected ? (
        <Button asChild size="1">
          <Link to={buildComparePathFromSlugs(selectedSlugs)}>Open comparison</Link>
        </Button>
      ) : isFull ? (
        <Button asChild size="1" variant="ghost">
          <Link to={buildComparePathFromSlugs(selectedSlugs)}>Comparison is full</Link>
        </Button>
      ) : (
        <Button asChild size="1" variant="ghost">
          <Link to={compareHref}>Add to comparison</Link>
        </Button>
      )}
    </div>
  );
}

function HomeLedgerDetails({ row }: { row: HomeLedgerRow }) {
  return (
    <div {...props(styles.secondaryDetails)}>
      <span>{row.highlights}</span>
      <span>{row.priceSignal}</span>
      <span>{row.freshness}</span>
    </div>
  );
}
