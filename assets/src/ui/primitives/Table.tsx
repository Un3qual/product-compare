import * as stylex from "@stylexjs/stylex";
import type { StyleXStyles } from "@stylexjs/stylex";
import type { ComponentProps } from "react";
import { tokens } from "../theme/tokens.stylex";
import { customClassName } from "./utils.stylex";

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

export function Table({ className, style, ...tableProps }: ComponentProps<"table">) {
  return (
    <div {...stylex.props(styles.wrapper)} data-slot="table-container">
      <table
        {...stylex.props(styles.root, customClassName(className), style as StyleXStyles)}
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
export const TableRow = ({ className, style, ...rowProps }: ComponentProps<"tr">) => (
  <tr
    {...stylex.props(styles.row, customClassName(className), style as StyleXStyles)}
    data-slot="table-row"
    {...rowProps}
  />
);
export const TableHead = ({ className, style, ...headProps }: ComponentProps<"th">) => (
  <th
    {...stylex.props(styles.head, customClassName(className), style as StyleXStyles)}
    data-slot="table-head"
    {...headProps}
  />
);
export const TableCell = ({ className, style, ...cellProps }: ComponentProps<"td">) => (
  <td
    {...stylex.props(styles.cell, customClassName(className), style as StyleXStyles)}
    data-slot="table-cell"
    {...cellProps}
  />
);
export const TableCaption = ({ className, style, ...captionProps }: ComponentProps<"caption">) => (
  <caption
    {...stylex.props(styles.caption, customClassName(className), style as StyleXStyles)}
    data-slot="table-caption"
    {...captionProps}
  />
);
