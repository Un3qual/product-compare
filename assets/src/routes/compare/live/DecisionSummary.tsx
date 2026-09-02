import { useMemo, type ReactNode } from "react";
import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "$ui/primitives/Table";
import { tokens } from "$ui/theme/tokens.stylex";
import { productOffersPath } from "../../offers/paths";
import type { CompareProductSummary, CompareRouteLoaderData } from "../compare-route-data";
import { buildDecisionSummaryMetricRows } from "./decision-summary";

type OfferContexts = Extract<CompareRouteLoaderData, { status: "ready" }>["offerContexts"];

type DecisionTableRow = {
  cells: ReactNode[];
  key: string;
  label: string;
};

const tableModel = tableFeatures({});
const columnHelper = createColumnHelper<typeof tableModel, DecisionTableRow>();

const styles = create({
  section: { display: "grid", gap: "0.85rem" },
  title: { fontSize: "1.25rem", margin: 0 },
  description: { color: tokens.textSecondary, margin: 0 },
  tableWrap: {
    borderColor: tokens.borderQuiet,
    borderRadius: "var(--pc-radius-large)",
    borderStyle: "solid",
    borderWidth: "1px",
    overflow: "hidden",
  },
  table: { minWidth: "48rem" },
});

export function DecisionSummary({
  offerContexts,
  products,
}: {
  offerContexts: OfferContexts;
  products: CompareProductSummary[];
}) {
  const rows = useMemo(() => decisionTableRows(products, offerContexts), [offerContexts, products]);
  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.display({
          id: "decision",
          header: "Decision",
          cell: ({ row }) => row.original.label,
        }),
        ...products.map((product, index) =>
          columnHelper.accessor((row) => row.cells[index], {
            id: product.id,
            header: product.name,
            cell: (info) => info.getValue(),
          }),
        ),
      ]),
    [products],
  );
  const table = useTable({
    columns,
    data: rows,
    features: tableModel,
    getRowId: (row) => row.key,
  });

  if (products.length === 0) {
    return null;
  }

  return (
    <section {...props(styles.section)}>
      <h2 {...props(styles.title)}>Decision summary</h2>
      <p {...props(styles.description)}>
        Price comparisons use the offers currently shown for these products.
      </p>
      <div {...props(styles.tableWrap)}>
        <Table aria-label="Decision summary" style={styles.table}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} scope="col">
                    {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell, index) =>
                  index === 0 ? (
                    <TableHead key={cell.id} scope="row">
                      <table.FlexRender cell={cell} />
                    </TableHead>
                  ) : (
                    <TableCell key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ),
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function decisionTableRows(
  products: CompareProductSummary[],
  offerContexts: OfferContexts,
): DecisionTableRow[] {
  const metricRows = buildDecisionSummaryMetricRows(products, offerContexts).map((row) => ({
    cells: row.cells.map((cell) => cell.value),
    key: row.key,
    label: row.label,
  }));

  const compareSlugs = products.map((product) => product.slug);

  return [
    ...metricRows,
    {
      cells: products.map((product) => (
        <Link key={product.id} to={productOffersPath(product.id, compareSlugs)}>
          Review {product.name} offers
        </Link>
      )),
      key: "review-offers",
      label: "Review offers link",
    },
  ];
}
