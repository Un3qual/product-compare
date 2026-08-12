import { useMemo } from "react";
import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import { create, props } from "@stylexjs/stylex";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "$ui/primitives/Table";
import type { CompareProductSummary, CompareSpecMode } from "./compare-route-data";
import {
  buildSpecificationMatrixRows,
  type SpecificationMatrixRow,
} from "./specification-matrix-data";

const SPECIFICATION_MATRIX_TITLES: Record<CompareSpecMode, string> = {
  all: "All specifications",
  differences: "Different specifications",
  shared: "Shared specifications",
};
const EMPTY_SPECIFICATION_MATRIX_MESSAGES: Record<CompareSpecMode, string> = {
  all: "No specifications are available for these products yet.",
  differences: "No specification differences across these products yet.",
  shared: "No shared specifications across these products yet.",
};

const tableModel = tableFeatures({});
const columnHelper = createColumnHelper<typeof tableModel, SpecificationMatrixRow>();

const styles = create({
  table: { minWidth: "48rem" },
});

export function CompareSpecificationMatrix({
  products,
  specMode,
}: {
  products: CompareProductSummary[];
  specMode: CompareSpecMode;
}) {
  const rows = useMemo(
    () => buildSpecificationMatrixRows(products, specMode),
    [products, specMode],
  );
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
    data: rows,
    features: tableModel,
    getRowId: (row) => row.code,
  });

  if (products.length < 2) {
    return null;
  }

  const title = specificationMatrixTitle(specMode);

  return (
    <section aria-label="Specification comparison">
      <h2>{title}</h2>
      {rows.length === 0 ? (
        <p>{emptySpecificationMatrixMessage(specMode)}</p>
      ) : (
        <Table aria-label={title} {...props(styles.table)}>
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
    </section>
  );
}

function specificationMatrixTitle(specMode: CompareSpecMode) {
  return SPECIFICATION_MATRIX_TITLES[specMode] ?? SPECIFICATION_MATRIX_TITLES.shared;
}

function emptySpecificationMatrixMessage(specMode: CompareSpecMode) {
  return (
    EMPTY_SPECIFICATION_MATRIX_MESSAGES[specMode] ?? EMPTY_SPECIFICATION_MATRIX_MESSAGES.shared
  );
}
