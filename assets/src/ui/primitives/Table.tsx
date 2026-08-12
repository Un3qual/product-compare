import * as stylex from "@stylexjs/stylex";
import type { ComponentProps } from "react";
import { tokens } from "../theme/tokens.stylex";
import type { StyleXPrimitiveProps } from "./stylex-props";

const styles = stylex.create({
  caption: { color: tokens.textSecondary, fontSize: "0.875rem", marginTop: "1rem" },
  cell: { padding: tokens.tableCellSpace, verticalAlign: "middle" },
  head: {
    color: tokens.textSecondary,
    fontWeight: 700,
    padding: tokens.tableCellSpace,
    textAlign: "start",
    verticalAlign: "middle",
  },
  root: { borderCollapse: "collapse", captionSide: "bottom", width: "100%" },
  row: {
    backgroundColor: {
      ":hover": "color-mix(in srgb, var(--pc-surface-muted) 65%, transparent)",
      default: "transparent",
    },
    borderBottomColor: tokens.borderQuiet,
    borderBottomStyle: "solid",
    borderBottomWidth: "1px",
  },
  wrapper: { overflowX: "auto", position: "relative", width: "100%" },
});

export function Table({ style, ...tableProps }: StyleXPrimitiveProps<ComponentProps<"table">>) {
  return (
    <div {...stylex.props(styles.wrapper)} data-slot="table-container">
      <table
        {...stylex.props(styles.root, style)}
        data-slot="table"
        {...tableProps}
      />
    </div>
  );
}

export const TableHeader = (props: ComponentProps<"thead">) => (
  <thead data-slot="table-header" {...props} />
);
export const TableBody = (props: ComponentProps<"tbody">) => (
  <tbody data-slot="table-body" {...props} />
);
export const TableRow = ({
  style,
  ...rowProps
}: StyleXPrimitiveProps<ComponentProps<"tr">>) => (
  <tr
    {...stylex.props(styles.row, style)}
    data-slot="table-row"
    {...rowProps}
  />
);
export const TableHead = ({
  style,
  ...headProps
}: StyleXPrimitiveProps<ComponentProps<"th">>) => (
  <th
    {...stylex.props(styles.head, style)}
    data-slot="table-head"
    {...headProps}
  />
);
export const TableCell = ({
  style,
  ...cellProps
}: StyleXPrimitiveProps<ComponentProps<"td">>) => (
  <td
    {...stylex.props(styles.cell, style)}
    data-slot="table-cell"
    {...cellProps}
  />
);
export const TableCaption = ({
  style,
  ...captionProps
}: StyleXPrimitiveProps<ComponentProps<"caption">>) => (
  <caption
    {...stylex.props(styles.caption, style)}
    data-slot="table-caption"
    {...captionProps}
  />
);
