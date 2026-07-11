import type { PropsWithChildren, ReactNode } from "react";
import * as stylex from "@stylexjs/stylex";
import { Separator } from "../../primitives/separator";
import { tokens } from "../../theme/tokens.stylex";

const styles = stylex.create({
  shell: {
    backgroundColor: tokens.surface,
    minHeight: "100vh"
  },
  navContent: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
    marginInline: "auto",
    maxWidth: tokens.pageMax,
    width: "100%"
  },
  nav: {
    backdropFilter: "blur(18px)",
    backgroundColor: "color-mix(in srgb, var(--pc-surface-raised) 92%, transparent)",
    minHeight: tokens.navHeight,
    paddingBlock: "0.75rem",
    paddingInline: "clamp(1rem, 3vw, 2rem)",
    position: "sticky",
    top: 0,
    zIndex: 20
  },
  separator: {
    backgroundColor: tokens.border,
    height: "1px",
    width: "100%"
  },
  main: {
    minWidth: 0
  }
});

export function AppShell({
  children,
  navigation
}: PropsWithChildren<{ navigation?: ReactNode }>) {
  return (
    <div data-slot="app-shell" {...stylex.props(styles.shell)}>
      <nav {...stylex.props(styles.nav)} aria-label="Primary">
        <div {...stylex.props(styles.navContent)}>{navigation ?? "Product Compare"}</div>
      </nav>
      <Separator {...stylex.props(styles.separator)} />
      <main {...stylex.props(styles.main)}>{children}</main>
    </div>
  );
}
