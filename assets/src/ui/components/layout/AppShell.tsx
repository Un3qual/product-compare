import type { MouseEvent, PropsWithChildren, ReactNode } from "react";
import { create, props } from "@stylexjs/stylex";
import { Separator } from "../../primitives/Separator";
import { tokens } from "../../theme/tokens.stylex";

const styles = create({
  shell: {
    backgroundColor: tokens.surface,
    minHeight: "100vh",
  },
  skipLink: {
    ":focus-visible": {
      transform: "translateY(0)",
    },
    backgroundColor: tokens.actionAccent,
    borderRadius: "0.5rem",
    color: tokens.textInverted,
    fontWeight: 700,
    insetBlockStart: "0.75rem",
    insetInlineStart: "0.75rem",
    paddingBlock: "0.65rem",
    paddingInline: "0.9rem",
    position: "absolute",
    transform: "translateY(-200%)",
    zIndex: 30,
  },
  navContent: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
    marginInline: "auto",
    maxWidth: tokens.pageMax,
    width: "100%",
  },
  nav: {
    backdropFilter: "blur(18px)",
    backgroundColor: "color-mix(in srgb, var(--pc-surface-raised) 92%, transparent)",
    minHeight: tokens.navHeight,
    paddingBlock: "0.75rem",
    paddingInline: "clamp(1rem, 3vw, 2rem)",
    position: "sticky",
    top: 0,
    zIndex: 20,
  },
  separator: {
    backgroundColor: tokens.border,
    height: "1px",
    width: "100%",
  },
  main: {
    minWidth: 0,
  },
});

function focusMainContent(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
  document.getElementById("main-content")?.focus();
}

export function AppShell({ children, navigation }: PropsWithChildren<{ navigation?: ReactNode }>) {
  return (
    <div data-slot="app-shell" {...props(styles.shell)}>
      <a href="#main-content" onClick={focusMainContent} {...props(styles.skipLink)}>
        Skip to main content
      </a>
      <nav {...props(styles.nav)} aria-label="Primary">
        <div {...props(styles.navContent)}>{navigation ?? "Product Compare"}</div>
      </nav>
      <Separator style={styles.separator} />
      <main id="main-content" tabIndex={-1} {...props(styles.main)}>
        {children}
      </main>
    </div>
  );
}
