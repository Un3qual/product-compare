import type { PropsWithChildren, ReactNode } from "react";
import * as stylex from "@stylexjs/stylex";
import { tokens } from "../../theme/tokens.stylex";

const styles = stylex.create({
  list: {
    borderBlockStartColor: tokens.borderQuiet,
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: "1px",
    listStyle: "none",
    margin: 0,
    padding: 0
  },
  item: {
    alignItems: "start",
    borderBlockEndColor: tokens.borderQuiet,
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "1px",
    display: "grid",
    gap: "1rem",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    paddingBlock: "1.25rem"
  },
  body: {
    minWidth: 0
  },
  actions: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.6rem",
    justifyContent: "end"
  }
});

export function DataList({
  children,
  label
}: PropsWithChildren<{ label: string }>) {
  return (
    <ul aria-label={label} {...stylex.props(styles.list)}>
      {children}
    </ul>
  );
}

export function DataListItem({
  actions,
  children
}: PropsWithChildren<{ actions?: ReactNode }>) {
  return (
    <li {...stylex.props(styles.item)}>
      <div {...stylex.props(styles.body)}>{children}</div>
      {actions ? <div {...stylex.props(styles.actions)}>{actions}</div> : null}
    </li>
  );
}
