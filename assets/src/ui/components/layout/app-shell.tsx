import type { PropsWithChildren, ReactNode } from "react";
import * as stylex from "@stylexjs/stylex";
import { tokens } from "../../theme/tokens.stylex";

const styles = stylex.create({
  navContent: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between"
  },
  nav: {
    borderBottomColor: tokens.border,
    borderBottomStyle: "solid",
    borderBottomWidth: "1px",
    paddingBlock: "12px",
    paddingInline: "16px"
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
      <main>{children}</main>
    </>
  );
}
