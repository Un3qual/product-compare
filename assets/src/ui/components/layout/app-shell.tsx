import type { PropsWithChildren, ReactNode } from "react";
import * as stylex from "@stylexjs/stylex";
import { Separator } from "../../primitives";
import { tokens } from "../../theme/tokens.stylex";

const styles = stylex.create({
  navContent: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between"
  },
  nav: {
    paddingBlock: "12px",
    paddingInline: "16px"
  },
  separator: {
    backgroundColor: tokens.border,
    height: "1px",
    width: "100%"
  }
});

export function AppShell({
  children,
  navigation
}: PropsWithChildren<{ navigation?: ReactNode }>) {
  return (
    <>
      <nav {...stylex.props(styles.nav)} aria-label="Primary">
        <div {...stylex.props(styles.navContent)}>{navigation ?? "Product Compare"}</div>
      </nav>
      <Separator {...stylex.props(styles.separator)} />
      <main>{children}</main>
    </>
  );
}
