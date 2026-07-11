import { Table } from "@radix-ui/themes";
import { useId, type ReactNode } from "react";
import { create, props } from "@stylexjs/stylex";

const styles = create({
  title: {
    height: "1px",
    margin: "-1px",
    overflow: "hidden",
    padding: 0,
    position: "absolute",
    width: "1px",
    clip: "rect(0 0 0 0)",
    whiteSpace: "nowrap"
  }
});

export type RecordTableColumn = {
  key: string;
  label: ReactNode;
};

export type RecordTableRow = {
  cells: Record<string, ReactNode>;
  key: string;
};

export function RecordTable({
  columns,
  label,
  rows
}: {
  columns: readonly RecordTableColumn[];
  label: string;
  rows: readonly RecordTableRow[];
}) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId}>
      <h2 id={titleId} {...props(styles.title)}>
        {label}
      </h2>
      <Table.Root variant="surface">
        <Table.Header>
          <Table.Row>
            {columns.map((column) => (
              <Table.ColumnHeaderCell key={column.key}>
                {column.label}
              </Table.ColumnHeaderCell>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {rows.map((row) => (
            <Table.Row key={row.key}>
              {columns.map((column) => (
                <Table.Cell key={column.key}>{row.cells[column.key]}</Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </section>
  );
}
