import type { PropsWithChildren, ReactNode } from "react";
import * as stylex from "@stylexjs/stylex";

const styles = stylex.create({
  page: {
    display: "grid",
    gap: "1.5rem",
    marginInline: "auto",
    maxWidth: "72rem",
    paddingBlock: "2rem",
    paddingInline: "1.5rem"
  },
  header: {
    alignItems: "end",
    display: "flex",
    flexWrap: "wrap",
    gap: "1rem",
    justifyContent: "space-between"
  },
  title: {
    fontSize: "2rem",
    lineHeight: 1.1,
    margin: 0
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem"
  }
});

export interface CompareShellProps extends PropsWithChildren {
  actions?: ReactNode;
  title: string;
}

export function CompareShell({ actions, children, title }: CompareShellProps) {
  return (
    <section {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <h1 {...stylex.props(styles.title)}>{title}</h1>
        {actions ? <div {...stylex.props(styles.actions)}>{actions}</div> : null}
      </header>
      {children}
    </section>
  );
}
