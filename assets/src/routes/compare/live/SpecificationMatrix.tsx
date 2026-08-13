import { useMemo } from "react";
import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import { create } from "@stylexjs/stylex";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "$ui/primitives/Table";
import type { CompareProductSummary, CompareSpecMode } from "../compare-route-data";
import { specificationMatrixView, type SpecificationMatrixRow } from "./specification-matrix";

const tableModel = tableFeatures({});
const columnHelper = createColumnHelper<typeof tableModel, SpecificationMatrixRow>();

const styles = create({
  table: { minWidth: "48rem" },
});

export function SpecificationMatrix({
  products,
  specMode,
}: {
  products: CompareProductSummary[];
  specMode: CompareSpecMode;
}) {
  const view = useMemo(() => specificationMatrixView(products, specMode), [products, specMode]);
  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.display({
          id: "specification",
          header: "Specification",
          cell: ({ row }) => row.original.displayName,
        }),
        ...products.map((product, index) =>
          columnHelper.accessor((row) => row.values[index] ?? "—", {
            id: product.id,
            header: product.name,
          }),
        ),
      ]),
    [products],
  );
  const table = useTable({
    columns,
    data: view.rows,
    features: tableModel,
    getRowId: (row) => row.code,
  });

  if (products.length < 2) return null;

  return (
    <div>
      <h2>{view.title}</h2>
      {view.rows.length === 0 ? (
        <p>{view.emptyMessage}</p>
      ) : (
        <Table aria-label={view.title} style={styles.table}>
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
      )}
    </div>
  );
}
