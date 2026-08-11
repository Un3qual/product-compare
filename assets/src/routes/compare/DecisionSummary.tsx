import type { ReactNode } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import { tokens } from "$ui/theme/tokens.stylex";
import { productOffersPath } from "../offers/paths";

import type { CompareProductSummary, CompareRouteLoaderData } from "./compare-route-data";
import {
  buildDecisionSummaryMetricRows,
  type DecisionSummaryMetricRow,
} from "./decision-summary-data";

const styles = create({
  section: {
    display: "grid",
    gap: "0.85rem",
  },
  title: {
    fontSize: "1.25rem",
    margin: 0,
  },
  description: {
    color: tokens.textSecondary,
    margin: 0,
  },
  tableWrap: {
    borderColor: tokens.borderQuiet,
    borderRadius: "var(--pc-radius-large)",
    borderStyle: "solid",
    borderWidth: "1px",
    overflowX: "auto",
  },
  table: {
    borderCollapse: "collapse",
    minWidth: "48rem",
    width: "100%",
  },
});

export function DecisionSummary({
  offerContexts,
  products,
}: {
  offerContexts: Extract<CompareRouteLoaderData, { status: "ready" }>["offerContexts"];
  products: CompareProductSummary[];
}) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section {...props(styles.section)}>
      <h2 {...props(styles.title)}>Decision summary</h2>
      <p {...props(styles.description)}>
        Relative loaded price compares only the offers already loaded for these products.
      </p>
      <div {...props(styles.tableWrap)}>
        <table aria-label="Decision summary" {...props(styles.table)}>
          <DecisionSummaryHeader products={products} />
          <DecisionSummaryBody offerContexts={offerContexts} products={products} />
        </table>
      </div>
    </section>
  );
}

function DecisionSummaryBody({
  offerContexts,
  products,
}: {
  offerContexts: Extract<CompareRouteLoaderData, { status: "ready" }>["offerContexts"];
  products: CompareProductSummary[];
}) {
  return (
    <tbody>
      <DecisionSummaryMetricRows offerContexts={offerContexts} products={products} />
      <ReviewOffersRow products={products} />
    </tbody>
  );
}

function DecisionSummaryHeader({ products }: { products: CompareProductSummary[] }) {
  return (
    <thead>
      <tr>
        <th scope="col">Decision</th>
        {products.map((product) => (
          <th key={product.id} scope="col">
            {product.name}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function DecisionSummaryMetricRows({
  offerContexts,
  products,
}: {
  offerContexts: Extract<CompareRouteLoaderData, { status: "ready" }>["offerContexts"];
  products: CompareProductSummary[];
}) {
  return (
    <>
      {buildDecisionSummaryMetricRows(products, offerContexts).map((row) => (
        <DecisionSummaryMetricRowView key={row.key} row={row} />
      ))}
    </>
  );
}

function DecisionSummaryMetricRowView({ row }: { row: DecisionSummaryMetricRow }) {
  return (
    <tr>
      <th scope="row">{row.label}</th>
      {row.cells.map((cell) => (
        <td key={`${cell.productId}-${row.key}`}>{cell.value}</td>
      ))}
    </tr>
  );
}

function ReviewOffersRow({ products }: { products: CompareProductSummary[] }) {
  return (
    <DecisionSummaryRow
      cellKey="review-offers"
      label="Review offers link"
      products={products}
      renderCell={(product) => (
        <Link to={productOffersPath(product.id)}>Review {product.name} offers</Link>
      )}
    />
  );
}

function DecisionSummaryRow({
  cellKey,
  label,
  products,
  renderCell,
}: {
  cellKey: string;
  label: string;
  products: CompareProductSummary[];
  renderCell: (product: CompareProductSummary) => ReactNode;
}) {
  return (
    <tr>
      <th scope="row">{label}</th>
      {products.map((product) => (
        <td key={`${product.id}-${cellKey}`}>{renderCell(product)}</td>
      ))}
    </tr>
  );
}
