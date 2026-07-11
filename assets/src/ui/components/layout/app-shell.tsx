import type { PropsWithChildren, ReactNode } from "react";
import { create, props } from "@stylexjs/stylex";
import { Separator } from "../../primitives/separator";
import { tokens } from "../../theme/tokens.stylex";

const styles = create({
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
    <div data-slot="app-shell" {...props(styles.shell)}>
      <nav {...props(styles.nav)} aria-label="Primary">
        <div {...props(styles.navContent)}>{navigation ?? "Product Compare"}</div>
      </nav>
      <Separator {...props(styles.separator)} />
      <main {...props(styles.main)}>{children}</main>
    </div>
  );
}
