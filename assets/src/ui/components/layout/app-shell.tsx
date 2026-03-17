import type { PropsWithChildren } from "react";
import * as stylex from "@stylexjs/stylex";
import { tokens } from "../../theme/tokens.stylex";

const styles = stylex.create({
  nav: {
    borderBottomColor: tokens.border,
    borderBottomStyle: "solid",
    borderBottomWidth: "1px",
    paddingBlock: "12px",
    paddingInline: "16px"
  }
});

export function AppShell({ children }: PropsWithChildren) {
  return (
    <>
      <nav {...stylex.props(styles.nav)} aria-label="Primary">
        Product Compare
      </nav>
      <main>{children}</main>
    </>
  );
}
